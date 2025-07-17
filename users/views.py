from django.shortcuts import render
from django.contrib.auth import login as auth_login, logout as auth_logout, authenticate
from django.http import HttpResponseRedirect
from django.urls import reverse
from audit.utils import log_audit
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.contrib.auth.decorators import user_passes_test
from .forms import UserCreationForm
from django.contrib.auth.decorators import login_required
from .forms import UserProfileForm
from django.contrib import messages

# Example login view

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            log_audit(user, 'login', None, 'User logged in')
            return HttpResponseRedirect(reverse('dashboard'))
        else:
            return render(request, 'assets/login.html', {'error': 'Invalid credentials'})
    return render(request, 'assets/login.html')

# Example logout view

def logout_view(request):
    if request.user.is_authenticated:
        log_audit(request.user, 'logout', None, 'User logged out')
    auth_logout(request)
    return HttpResponseRedirect(reverse('login'))

@require_POST
@user_passes_test(lambda u: u.is_authenticated and u.role == 'admin')
def api_create_user(request):
    form = UserCreationForm(request.POST)
    if form.is_valid():
        user = form.save()
        log_audit(request.user, 'create', None, f'User created via asset form: {user.username}')
        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'display': str(user),
            }
        })
    else:
        return JsonResponse({'success': False, 'errors': form.errors}, status=400)

@login_required
def profile(request):
    user = request.user
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=user)
        if form.is_valid():
            form.save()
            log_audit(user, 'edit', None, 'Profile updated')
            messages.success(request, 'Profile updated successfully.')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = UserProfileForm(instance=user)
    # Assigned assets and activity logs will be loaded via AJAX
    return render(request, 'users/profile.html', {'form': form, 'user_obj': user})
