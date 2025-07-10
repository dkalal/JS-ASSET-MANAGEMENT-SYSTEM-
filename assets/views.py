from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, permission_required, user_passes_test
from django.urls import reverse_lazy
from django.views.generic import CreateView, ListView, DetailView, TemplateView
from .models import Asset, AssetCategory, AssetCategoryField, ExportLog
from .forms import AssetForm
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import re
from django.http import HttpResponse
import csv
import pandas as pd
from django.conf import settings
from django.template.loader import render_to_string
from weasyprint import HTML
import tempfile
from datetime import datetime
import openpyxl
from django.core.files.storage import default_storage
from django.contrib import messages
from openpyxl.utils import get_column_letter
from django.db import transaction
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from audit.models import AuditLog

# Permission check: only admin/manager
def is_admin_or_manager(user):
    return user.is_authenticated and user.role in ('admin', 'manager')

# Create your views here.

class AssetCreateView(CreateView):
    model = Asset
    form_class = AssetForm
    template_name = 'assets/asset_form.html'
    success_url = reverse_lazy('asset_list')

    def form_valid(self, form):
        asset = form.save(commit=False)
        asset.save()  # Save first to ensure UUID is set
        # Generate QR code with direct URL
        base_url = self.request.build_absolute_uri('/')[:-1]  # Remove trailing slash
        qr_url = f"{base_url}/assets/{asset.uuid}/"
        qr = qrcode.make(qr_url)
        buffer = BytesIO()
        qr.save(buffer, 'PNG')
        asset.qr_code.save(f"asset_{asset.uuid}.png", ContentFile(buffer.getvalue()), save=False)
        asset.save()
        return super().form_valid(form)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['initial'] = kwargs.get('initial', {})
        kwargs['initial']['request'] = self.request
        return kwargs

asset_create = login_required(AssetCreateView.as_view())

@require_GET
def get_dynamic_fields(request):
    category_id = request.GET.get('category_id')
    try:
        category = AssetCategory.objects.get(pk=category_id)
        return JsonResponse({'success': True, 'fields': category.dynamic_fields})
    except AssetCategory.DoesNotExist:
        return JsonResponse({'success': False, 'fields': {}})

class AssetListView(ListView):
    model = Asset
    template_name = 'assets/asset_list.html'
    context_object_name = 'assets'
    paginate_by = 20

    def get_queryset(self):
        qs = super().get_queryset().select_related('category', 'assigned_to')
        category = self.request.GET.get('category')
        status = self.request.GET.get('status')
        location = self.request.GET.get('location')
        search = self.request.GET.get('search')
        # Dynamic field filters
        dynamic_filters = {}
        if category:
            qs = qs.filter(category__id=category)
            # Fetch dynamic fields for this category
            fields = AssetCategoryField.objects.filter(category_id=category)
            for field in fields:
                val = self.request.GET.get(f'dyn_{field.key}')
                if val:
                    # Filter by dynamic_data JSON key
                    if field.type == 'text':
                        qs = qs.filter(**{f'dynamic_data__{field.key}__icontains': val})
                    elif field.type == 'number':
                        try:
                            qs = qs.filter(**{f'dynamic_data__{field.key}': float(val)})
                        except ValueError:
                            pass
                    elif field.type == 'date':
                        qs = qs.filter(**{f'dynamic_data__{field.key}': val})
        if status:
            qs = qs.filter(status=status)
        if location:
            qs = qs.filter(dynamic_data__location__icontains=location)
        if search:
            qs = qs.filter(
                Q(dynamic_data__name__icontains=search) |
                Q(dynamic_data__model__icontains=search) |
                Q(description__icontains=search)
            )
        return qs.order_by('-created_at')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = AssetCategory.objects.all()
        context['statuses'] = Asset.STATUS_CHOICES
        # For dynamic filter UI
        selected_category = self.request.GET.get('category')
        if selected_category:
            context['dynamic_fields'] = AssetCategoryField.objects.filter(category_id=selected_category)
        else:
            context['dynamic_fields'] = []
        return context

class AssetDetailView(DetailView):
    model = Asset
    template_name = 'assets/asset_detail.html'
    context_object_name = 'asset'

    def get(self, request, *args, **kwargs):
        asset = self.get_object()
        # Redirect to UUID-based URL if accessed by PK
        return redirect('asset_detail_by_uuid', uuid=asset.uuid)

class AssetScanView(TemplateView):
    template_name = 'assets/asset_scan.html'

@require_GET
@csrf_exempt
def asset_by_code(request):
    code = request.GET.get('code')
    asset = None
    if code:
        # Try to extract UUID from QR code format 'ASSET|v1|{uuid}'
        match = re.match(r'^ASSET\|v1\|([0-9a-fA-F-]{36})$', code)
        if match:
            uuid_val = match.group(1)
            asset = Asset.objects.filter(uuid=uuid_val).first()
        # Fallback: Try by QR code filename or asset ID
        if not asset:
            asset = Asset.objects.filter(qr_code__icontains=code).first()
        if not asset and code.isdigit():
            asset = Asset.objects.filter(pk=int(code)).first()
    if asset:
        data = {
            'id': asset.pk,
            'dynamic_data': asset.dynamic_data,
            'category_name': asset.category.name,
            'status': asset.status,
            'assigned_to': str(asset.assigned_to) if asset.assigned_to else '',
            'created_at': asset.created_at.strftime('%Y-%m-%d %H:%M'),
        }
        return JsonResponse({'success': True, 'asset': data})
    return JsonResponse({'success': False})

class AssetDetailByUUIDView(DetailView):
    model = Asset
    template_name = 'assets/asset_detail.html'
    context_object_name = 'asset'
    slug_field = 'uuid'
    slug_url_kwarg = 'uuid'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['accessed_by_uuid'] = True
        return context

# Export endpoint (robust, supports GET and POST, individual/bulk)
def asset_export(request):
    if request.method == 'POST':
        format = request.POST.get('format', 'csv')
        columns = request.POST.getlist('columns')
        selected_ids = request.POST.get('selected_ids', '')
    else:
        format = request.GET.get('format', 'csv')
        columns = request.GET.getlist('columns')
        selected_ids = request.GET.get('selected_ids', '')
    # Reuse AssetListView filtering logic
    assets = Asset.objects.all()
    # If selected_ids provided, filter by those
    if selected_ids:
        id_list = [int(pk) for pk in selected_ids.split(',') if pk.strip().isdigit()]
        assets = assets.filter(pk__in=id_list)
    else:
        category = request.GET.get('category')
        status = request.GET.get('status')
        location = request.GET.get('location')
        search = request.GET.get('search')
        if category:
            assets = assets.filter(category__id=category)
            fields = AssetCategoryField.objects.filter(category_id=category)
            for field in fields:
                val = request.GET.get(f'dyn_{field.key}')
                if val:
                    if field.type == 'text':
                        assets = assets.filter(**{f'dynamic_data__{field.key}__icontains': val})
                    elif field.type == 'number':
                        try:
                            assets = assets.filter(**{f'dynamic_data__{field.key}': float(val)})
                        except ValueError:
                            pass
                    elif field.type == 'date':
                        assets = assets.filter(**{f'dynamic_data__{field.key}': val})
        if status:
            assets = assets.filter(status=status)
        if location:
            assets = assets.filter(dynamic_data__location__icontains=location)
        if search:
            assets = assets.filter(
                Q(dynamic_data__name__icontains=search) |
                Q(dynamic_data__model__icontains=search) |
                Q(description__icontains=search)
            )
    # Prepare data
    data = []
    for asset in assets:
        row = {}
        # Core fields
        row['ID'] = asset.pk
        row['Category'] = asset.category.name
        row['Status'] = asset.status
        row['Assigned To'] = str(asset.assigned_to) if asset.assigned_to else ''
        row['Created'] = asset.created_at.strftime('%Y-%m-%d %H:%M')
        row['Updated'] = asset.updated_at.strftime('%Y-%m-%d %H:%M')
        # Dynamic fields
        for k, v in asset.dynamic_data.items():
            row[k] = v
        data.append(row)
    # Filter columns
    if columns:
        data = [ {k: row.get(k, '') for k in columns} for row in data ]
    # Large export warning
    large_export = len(data) > 1000
    # Log export
    log = ExportLog.objects.create(
        user=request.user if request.user.is_authenticated else None,
        format=format,
        columns=columns,
        filters=request.POST.dict() if request.method == 'POST' else request.GET.dict(),
        success=True
    )
    try:
        if format == 'csv':
            df = pd.DataFrame(data)
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="assets_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"'
            if large_export:
                response['X-Export-Warning'] = 'Export is very large and may take time.'
            df.to_csv(response, index=False)
            return response
        elif format == 'xlsx':
            df = pd.DataFrame(data)
            response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="assets_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"'
            if large_export:
                response['X-Export-Warning'] = 'Export is very large and may take time.'
            with pd.ExcelWriter(response, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name='Assets')
            return response
        elif format == 'pdf':
            html_string = render_to_string('assets/export_pdf.html', {
                'assets': data,
                'columns': columns or (data[0].keys() if data else []),
                'logo_url': settings.STATIC_URL + 'img/logo.png',
                'export_date': datetime.now(),
            })
            import os
            fd, temp_path = tempfile.mkstemp(suffix='.pdf')
            os.close(fd)
            try:
                HTML(string=html_string, base_url=request.build_absolute_uri('/')).write_pdf(temp_path)
                with open(temp_path, 'rb') as f:
                    pdf = f.read()
            finally:
                os.remove(temp_path)
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="assets_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"'
            if large_export:
                response['X-Export-Warning'] = 'Export is very large and may take time.'
            return response
        else:
            log.success = False
            log.error_message = 'Invalid export format'
            log.save()
            return HttpResponse('Invalid export format', status=400)
    except Exception as e:
        log.success = False
        log.error_message = str(e)
        log.save()
        return HttpResponse(f'Export failed: {e}', status=500)

@login_required
@user_passes_test(is_admin_or_manager, login_url='login')
def download_import_template(request):
    # Generate Excel template for selected category
    category_id = request.GET.get('category')
    if not category_id:
        return HttpResponse('Category required', status=400)
    category = AssetCategory.objects.get(pk=category_id)
    dynamic_fields = AssetCategoryField.objects.filter(category=category)
    wb = openpyxl.Workbook()
    ws = wb.active
    # Core fields
    columns = ['status', 'description', 'assigned_to']
    # Dynamic fields
    columns += [f.key for f in dynamic_fields]
    ws.append(columns)
    # Add sample row
    if request.GET.get('example') == '1':
        # Provide realistic example data
        sample = ['active', 'Laptop for CEO', 'manager']
        for f in dynamic_fields:
            if f.key == 'serial_number':
                sample.append('SN123456')
            elif f.key == 'location':
                sample.append('HQ Office')
            elif f.key == 'purchase_date':
                sample.append('2023-01-15')
            else:
                sample.append('Example')
        ws.append(sample)
    else:
        sample = ['active', 'Sample asset', 'manager'] + ['' for _ in dynamic_fields]
        ws.append(sample)
    # Style header
    for i, col in enumerate(columns, 1):
        ws[f'{get_column_letter(i)}1'].font = openpyxl.styles.Font(bold=True)
    # Return as response
    import os
    fd, temp_path = tempfile.mkstemp(suffix='.xlsx')
    os.close(fd)
    try:
        wb.save(temp_path)
        with open(temp_path, 'rb') as f:
            file_data = f.read()
    finally:
        os.remove(temp_path)
    response = HttpResponse(file_data, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    if request.GET.get('example') == '1':
        response['Content-Disposition'] = f'attachment; filename=asset_import_example_{category.name}.xlsx'
    else:
        response['Content-Disposition'] = f'attachment; filename=asset_import_template_{category.name}.xlsx'
    return response

@method_decorator(user_passes_test(is_admin_or_manager, login_url='login'), name='dispatch')
class AssetBulkImportView(View):
    template_name = 'assets/asset_bulk_import.html'

    def get(self, request):
        # Step 1: Select category, download template
        categories = AssetCategory.objects.all()
        selected_category = request.GET.get('category')
        step = request.GET.get('step', '1')
        context = {'categories': categories, 'selected_category': selected_category, 'step': step}
        return render(request, self.template_name, context)

    def post(self, request):
        # Step 2: Upload and preview file
        categories = AssetCategory.objects.all()
        selected_category = request.POST.get('category')
        step = request.POST.get('step', '2')
        file = request.FILES.get('import_file')
        preview_data = []
        errors = []
        columns = []
        import_file = request.POST.get('import_file')
        if step == '3':
            # Final confirmation: import assets
            # Re-read the file from temp storage
            file_path = default_storage.path(import_file)
            try:
                wb = openpyxl.load_workbook(file_path)
                ws = wb.active
                columns = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
                for row in ws.iter_rows(min_row=2, values_only=True):
                    row_data = dict(zip(columns, row))
                    preview_data.append(row_data)
            except Exception as e:
                errors.append(f'Failed to parse file: {e}')
            dynamic_fields = AssetCategoryField.objects.filter(category_id=selected_category)
            success_count = 0
            fail_count = 0
            fail_rows = []
            with transaction.atomic():
                for i, row in enumerate(preview_data):
                    try:
                        # Validate required fields
                        for field in dynamic_fields:
                            if field.required and not row.get(field.key):
                                raise ValueError(f'Missing required field {field.label}')
                        asset = Asset(
                            category_id=selected_category,
                            status=row.get('status', 'active'),
                            description=row.get('description', ''),
                        )
                        # Assign user if provided
                        assigned_to = row.get('assigned_to')
                        if assigned_to:
                            from users.models import User
                            user_obj = User.objects.filter(username=assigned_to).first()
                            if user_obj:
                                asset.assigned_to = user_obj
                        # Dynamic fields
                        dyn_data = {}
                        for field in dynamic_fields:
                            dyn_data[field.key] = row.get(field.key)
                        asset.dynamic_data = dyn_data
                        asset.save()
                        success_count += 1
                    except Exception as e:
                        fail_count += 1
                        fail_rows.append({'row': i+2, 'error': str(e)})
                # Audit log
                from assets.models import ExportLog
                ExportLog.objects.create(
                    user=request.user,
                    format='import',
                    columns=columns,
                    filters={'category': selected_category},
                    success=(fail_count == 0),
                    error_message='; '.join([f"Row {r['row']}: {r['error']}" for r in fail_rows]) if fail_rows else ''
                )
            context = {
                'categories': categories,
                'selected_category': selected_category,
                'step': 'done',
                'success_count': success_count,
                'fail_count': fail_count,
                'fail_rows': fail_rows,
            }
            return render(request, self.template_name, context)
        if not file or not selected_category:
            messages.error(request, 'Please select a category and upload a file.')
            return render(request, self.template_name, {'categories': categories, 'selected_category': selected_category, 'step': '1'})
        # Save file temporarily
        tmp_path = default_storage.save('tmp/' + file.name, file)
        file_path = default_storage.path(tmp_path)
        try:
            wb = openpyxl.load_workbook(file_path)
            ws = wb.active
            columns = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
            for row in ws.iter_rows(min_row=2, values_only=True):
                row_data = dict(zip(columns, row))
                preview_data.append(row_data)
        except Exception as e:
            errors.append(f'Failed to parse file: {e}')
        # Validate rows (basic, more in confirm step)
        dynamic_fields = AssetCategoryField.objects.filter(category_id=selected_category)
        for i, row in enumerate(preview_data):
            for field in dynamic_fields:
                if field.required and not row.get(field.key):
                    errors.append(f'Row {i+2}: Missing required field {field.label}')
        context = {
            'categories': categories,
            'selected_category': selected_category,
            'step': step,
            'preview_data': preview_data,
            'columns': columns,
            'errors': errors,
            'import_file': tmp_path,
        }
        return render(request, self.template_name, context)

    def put(self, request):
        # Step 3: Confirm import (AJAX or form submit)
        # Not implemented yet
        pass

class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'assets/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        context['role'] = getattr(user, 'role', 'user')
        return context

@login_required
@require_GET
@csrf_exempt
def dashboard_summary_api(request):
    user = request.user
    role = getattr(user, 'role', 'user')
    qs = Asset.objects.all()
    if role == 'user':
        qs = qs.filter(assigned_to=user)
    elif role == 'manager':
        # Example: managers see all, or filter by department if available
        pass
    # Asset counts
    total_assets = qs.count()
    by_status = {k: qs.filter(status=k).count() for k, _ in Asset.STATUS_CHOICES}
    by_category = {}
    for cat in AssetCategory.objects.all():
        cat_qs = qs.filter(category=cat)
        by_category[cat.name] = cat_qs.count()
    # Optionally, add department breakdown if available
    return JsonResponse({
        'total_assets': total_assets,
        'by_status': by_status,
        'by_category': by_category,
    })

@login_required
@require_GET
@csrf_exempt
def dashboard_activity_api(request):
    user = request.user
    role = getattr(user, 'role', 'user')
    logs = AuditLog.objects.all().order_by('-timestamp')
    if role == 'user':
        logs = logs.filter(user=user)
    elif role == 'manager':
        # Example: managers see team logs if available
        pass
    logs = logs[:20]
    data = [
        {
            'user': str(log.user) if log.user else '',
            'action': log.action,
            'asset': str(log.asset) if log.asset else '',
            'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M'),
            'details': log.details,
        }
        for log in logs
    ]
    return JsonResponse({'activity': data})

@login_required
@require_GET
@csrf_exempt
def dashboard_scan_logs_api(request):
    user = request.user
    role = getattr(user, 'role', 'user')
    logs = AuditLog.objects.filter(action='view').order_by('-timestamp')
    if role == 'user':
        logs = logs.filter(user=user)
    elif role == 'manager':
        # Example: managers see team logs if available
        pass
    logs = logs[:5]
    data = [
        {
            'user': str(log.user) if log.user else '',
            'asset': str(log.asset) if log.asset else '',
            'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M'),
        }
        for log in logs
    ]
    return JsonResponse({'scan_logs': data})
