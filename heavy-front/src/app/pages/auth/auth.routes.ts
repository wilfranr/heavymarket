import { Routes } from '@angular/router';
import { Access } from './access';
import { Error } from './error';
import { Login } from './login';
import { ProviderLogin } from './login/provider-login';
import { guestGuard } from '../../core/auth/guards/guest.guard';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'login', component: Login, canActivate: [guestGuard] },
    { path: 'provider/login', component: ProviderLogin, canActivate: [guestGuard] }
] as Routes;
