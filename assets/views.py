from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.urls import reverse_lazy
from django.views.generic import CreateView, ListView, DetailView, TemplateView
from .models import Asset, AssetCategory
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
        # Filtering
        category = self.request.GET.get('category')
        status = self.request.GET.get('status')
        location = self.request.GET.get('location')
        search = self.request.GET.get('search')
        if category:
            qs = qs.filter(category__id=category)
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
