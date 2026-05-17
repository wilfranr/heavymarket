import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User, AuthResponse } from '../models/user.model';
import { Router } from '@angular/router';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let routerSpy: any;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                AuthService,
                { provide: Router, useValue: routerSpy }
            ]
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);

        // Limpiar localStorage antes de cada test
        localStorage.clear();
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    const apiUrl = '/v1';

    describe('login', () => {
        it('should login user and store token', async () => {
            const mockResponse: AuthResponse = {
                data: {
                    user: {
                        id: 1,
                        name: 'Test User',
                        email: 'test@example.com',
                        roles: []
                    },
                    access_token: 'test-token-123',
                    token_type: 'Bearer'
                }
            };

            const credentials = {
                email: 'test@example.com',
                password: 'password123'
            };

            const loginPromise = new Promise(resolve => {
                service.login(credentials).subscribe((response) => {
                    expect(response).toEqual(mockResponse);
                    expect(localStorage.getItem('access_token')).toBe('test-token-123');
                    expect(service.isAuthenticated()).toBe(true);
                    expect(service.currentUser()?.email).toBe('test@example.com');
                    resolve(true);
                });
            });

            const req = httpMock.expectOne(`${apiUrl}/login`);
            expect(req.request.method).toBe('POST');
            // JSDOM user agent
            expect(req.request.body.device_name).toContain('Mozilla/5.0');
            req.flush(mockResponse);
            
            await loginPromise;
        });

        it('should handle login error', async () => {
            const credentials = {
                email: 'test@example.com',
                password: 'wrong-password'
            };

            const errorPromise = new Promise(resolve => {
                service.login(credentials).subscribe({
                    error: (error) => {
                        expect(error).toBeTruthy();
                        expect(service.isAuthenticated()).toBe(false);
                        expect(localStorage.getItem('access_token')).toBeNull();
                        resolve(true);
                    }
                });
            });

            const req = httpMock.expectOne(`${apiUrl}/login`);
            req.error(new ProgressEvent('error'), { status: 401, statusText: 'Unauthorized' });
            
            await errorPromise;
        });
    });

    describe('logout', () => {
        it('should clear user data and token', async () => {
            // Simular usuario logueado
            localStorage.setItem('access_token', 'test-token');
            localStorage.setItem('current_user', JSON.stringify({ id: 1, name: 'Test', email: 'test@test.com', roles: [] }));

            const logoutPromise = new Promise(resolve => {
                service.logout().subscribe(() => {
                    expect(localStorage.getItem('access_token')).toBeNull();
                    expect(localStorage.getItem('current_user')).toBeNull();
                    expect(service.isAuthenticated()).toBe(false);
                    expect(service.currentUser()).toBeNull();
                    resolve(true);
                });
            });

            const req = httpMock.expectOne(`${apiUrl}/logout`);
            req.flush({});
            
            await logoutPromise;
        });
    });

    describe('isAuthenticated signal', () => {
        it('should return true when token exists', () => {
            // Simular carga desde storage (reinstanciar o forzar carga)
            localStorage.setItem('access_token', 'test-token');
            localStorage.setItem('current_user', JSON.stringify({ id: 1, name: 'Test', email: 'test@test.com', roles: [] }));
            
            // Forzar recarga de storage
            (service as any).loadUserFromStorage();
            
            expect(service.isAuthenticated()).toBe(true);
        });

        it('should return false when token does not exist', () => {
            expect(service.isAuthenticated()).toBe(false);
        });
    });

    describe('register', () => {
        it('should register new user successfully', async () => {
            const mockResponse: AuthResponse = {
                data: {
                    user: {
                        id: 1,
                        name: 'New User',
                        email: 'new@example.com',
                        roles: []
                    },
                    access_token: 'new-token-123',
                    token_type: 'Bearer'
                }
            };

            const registerData = {
                name: 'New User',
                email: 'new@example.com',
                password: 'password123',
                password_confirmation: 'password123'
            };

            const registerPromise = new Promise(resolve => {
                service.register(registerData).subscribe((response) => {
                    expect(response).toEqual(mockResponse);
                    expect(localStorage.getItem('access_token')).toBe('new-token-123');
                    expect(service.isAuthenticated()).toBe(true);
                    resolve(true);
                });
            });

            const req = httpMock.expectOne(`${apiUrl}/register`);
            expect(req.request.method).toBe('POST');
            req.flush(mockResponse);
            
            await registerPromise;
        });
    });

    describe('getToken', () => {
        it('should return stored token', () => {
            const token = 'test-token-123';
            localStorage.setItem('access_token', token);

            expect(service.getToken()).toBe(token);
        });

        it('should return null when no token', () => {
            expect(service.getToken()).toBeNull();
        });
    });
});
