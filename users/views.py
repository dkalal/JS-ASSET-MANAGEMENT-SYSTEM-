from django.shortcuts import render
from django.contrib.auth import login as auth_login, logout as auth_logout, authenticate
from django.http import HttpResponseRedirect
from django.urls import reverse
from audit.utils import log_audit

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
