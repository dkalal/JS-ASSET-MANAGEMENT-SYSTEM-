from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.contrib import messages
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.cache import never_cache
from django.contrib.auth.views import LoginView
from django.utils.decorators import method_decorator

@method_decorator([ensure_csrf_cookie, csrf_protect, never_cache], name='dispatch')
class EnterpriseLoginView(LoginView):
    """Enterprise Login View with enhanced CSRF protection"""
    template_name = 'registration/login.html'
    redirect_authenticated_user = True
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['csrf_token'] = self.request.META.get('CSRF_COOKIE')
        return context

@csrf_protect
def profile(request):
    """User profile view"""
    return render(request, 'users/profile.html', {'user_obj': request.user})

@csrf_protect
@never_cache
def custom_logout(request):
    """Custom logout view with proper CSRF handling"""
    if request.method == 'POST':
        logout(request)
        messages.success(request, 'You have been successfully logged out.')
        return redirect('login')
    
    return redirect('dashboard')