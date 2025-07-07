from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.urls import reverse_lazy
from django.views.generic import CreateView
from .models import Asset, AssetCategory
from .forms import AssetForm
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile

# Create your views here.

class AssetCreateView(CreateView):
    model = Asset
    form_class = AssetForm
    template_name = 'assets/asset_form.html'
    success_url = reverse_lazy('asset_list')

    def form_valid(self, form):
        asset = form.save(commit=False)
        # Generate QR code with asset info (e.g., asset ID or URL)
        qr = qrcode.make(f"AssetID:{asset.pk or 'new'}")
        buffer = BytesIO()
        qr.save(buffer, 'PNG')
        asset.qr_code.save(f"asset_{asset.pk or 'new'}.png", ContentFile(buffer.getvalue()), save=False)
        asset.save()
        return super().form_valid(form)

    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        # Dynamically add fields based on selected category (AJAX in template)
        return form

asset_create = login_required(AssetCreateView.as_view())
