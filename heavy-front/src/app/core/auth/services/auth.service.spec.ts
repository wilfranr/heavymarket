import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { User, AuthResponse } from '../models/user.model';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AuthService]
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

    describe('login', () => {
        it('should login user and store token', (done) => {
            const mockResponse: AuthResponse = {
                user: {
                    id: 1,
                    name: 'Test User',
                    email: 'test@example.com'
                },
                token: 'test-token-123',
                token_type: 'Bearer'
            };

            const credentials = {
                email: 'test@example.com',
                password: 'password123'
            };

            service.login(credentials).subscribe(response => {
                expect(response).toEqual(mockResponse);
                expect(localStorage.getItem('auth_token')).toBe('test-token-123');
                expect(service.isAuthenticated()).toBe(true);
                expect(service.currentUser()?.email).toBe('test@example.com');
                done();
            });

            const req = httpMock.expectOne('http://localhost:8000/api/v1/auth/login');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(credentials);
            req.flush(mockResponse);
        });

        it('should handle login error', (done) => {
            const credentials = {
                email: 'test@example.com',
                password: 'wrong-password'
            };

            service.login(credentials).subscribe({
                error: (error) => {
                    expect(error).toBeTruthy();
                    expect(service.isAuthenticated()).toBe(false);
                    expect(localStorage.getItem('auth_token')).toBeNull();
                    done();
                }
            });

            const req = httpMock.expectOne('http://localhost:8000/api/v1/auth/login');
            req.error(new ProgressEvent('error'), { status: 401, statusText: 'Unauthorized' });
        });
    });

    describe('logout', () => {
        it('should clear user data and token', () => {
            // Simular usuario logueado
            localStorage.setItem('auth_token', 'test-token');
            localStorage.setItem('auth_user', JSON.stringify({ id: 1, name: 'Test', email: 'test@test.com' }));
            
            service.logout();

            expect(localStorage.getItem('auth_token')).toBeNull();
            expect(localStorage.getItem('auth_user')).toBeNull();
            expect(service.isAuthenticated()).toBe(false);
            expect(service.currentUser()).toBeNull();
        });
    });

    describe('isAuthenticated', () => {
        it('should return true when token exists', () => {
            localStorage.setItem('auth_token', 'test-token');
            expect(service.isAuthenticated()).toBe(true);
        });

        it('should return false when token does not exist', () => {
            expect(service.isAuthenticated()).toBe(false);
        });
    });

    describe('register', () => {
        it('should register new user successfully', (done) => {
            const mockResponse: AuthResponse = {
                user: {
                    id: 1,
                    name: 'New User',
                    email: 'new@example.com'
                },
                token: 'new-token-123',
                token_type: 'Bearer'
            };

            const registerData = {
                name: 'New User',
                email: 'new@example.com',
                password: 'password123',
                password_confirmation: 'password123'
            };

            service.register(registerData).subscribe(response => {
                expect(response).toEqual(mockResponse);
                expect(localStorage.getItem('auth_token')).toBe('new-token-123');
                expect(service.isAuthenticated()).toBe(true);
                done();
            });

            const req = httpMock.expectOne('http://localhost:8000/api/v1/auth/register');
            expect(req.request.method).toBe('POST');
            req.flush(mockResponse);
        });
    });

    describe('getToken', () => {
        it('should return stored token', () => {
            const token = 'test-token-123';
            localStorage.setItem('auth_token', token);
            
            expect(service.getToken()).toBe(token);
        });

        it('should return null when no token', () => {
            expect(service.getToken()).toBeNull();
        });
    });
});
