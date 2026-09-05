import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { PasswordModule } from 'primeng/password';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToolbarModule } from 'primeng/toolbar';

import { User } from '../../../core/auth/models/user.model';
import { UsersActions } from '../../../store/users/actions/users.actions';
import { selectUsers, selectLoading, selectTotal, selectCurrentPage } from '../../../store/users/selectors/users.selectors';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        ToastModule,
        ConfirmDialogModule,
        FormsModule,
        TooltipModule,
        IconFieldModule,
        InputIconModule,
        TagModule,
        DialogModule,
        PasswordModule,
        MultiSelectModule,
        ToolbarModule
    ],
    providers: [MessageService],
    templateUrl: './list.html'
})
export class ListComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private readonly store = inject(Store);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    users$!: Observable<User[]>;
    loading$!: Observable<boolean>;
    total$!: Observable<number>;

    // Paginación
    currentPage = 1;
    rowsPerPage = 15;
    first = 0;
    searchTerm = '';

    // Dialog state
    userDialog: boolean = false;
    user: Partial<User> & { password?: string; currentRoles?: string[] } = {};
    dialogTitle: string = '';

    availableRoles = [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Administrador', value: 'Administrador' },
        { label: 'Analista', value: 'Analista' },
        { label: 'Vendedor', value: 'Vendedor' },
        { label: 'Logística', value: 'Logistica' },
        { label: 'Contabilidad', value: 'Contabilidad' },
        { label: 'Panel User', value: 'panel_user' }
    ];

    ngOnInit(): void {
        this.users$ = this.store.select(selectUsers);
        this.loading$ = this.store.select(selectLoading);
        this.total$ = this.store.select(selectTotal);

        this.cargarUsuarios();
    }

    cargarUsuarios(): void {
        this.store.dispatch(
            UsersActions.loadUsers({
                page: this.currentPage,
                search: this.searchTerm || ''
            })
        );
    }

    onPageChange(event: any): void {
        this.first = event.first;
        this.currentPage = event.page + 1;
        this.rowsPerPage = event.rows;
        this.cargarUsuarios();
    }

    onGlobalFilter(event: Event) {
        this.searchTerm = (event.target as HTMLInputElement).value;
        this.cargarUsuarios();
    }

    openNew(): void {
        this.user = { currentRoles: [] };
        this.dialogTitle = 'Nuevo Usuario';
        this.userDialog = true;
    }

    editUser(userEdit: User): void {
        this.user = { ...userEdit, currentRoles: userEdit.roles?.map((r: any) => (typeof r === 'string' ? r : r.name)) || [], password: '' };
        this.dialogTitle = 'Editar Usuario';
        this.userDialog = true;
    }

    hideDialog(): void {
        this.userDialog = false;
    }

    saveUser(): void {
        if (this.user.name?.trim() && this.user.email?.trim()) {
            const payload: any = {
                name: this.user.name,
                email: this.user.email,
                roles: this.user.currentRoles
            };

            if (this.user.password) {
                payload.password = this.user.password;
            }

            if (this.user.id) {
                this.store.dispatch(UsersActions.updateUser({ id: this.user.id, user: payload }));
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario Actualizado', life: 3000 });
            } else {
                this.store.dispatch(UsersActions.createUser({ user: payload }));
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario Creado', life: 3000 });
            }
            this.userDialog = false;
            this.cargarUsuarios();
        }
    }

    deleteUser(user: User): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar el usuario "${user.name}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.store.dispatch(UsersActions.deleteUser({ id: user.id! }));
                setTimeout(() => {
                    this.cargarUsuarios();
                }, 500);
            }
        });
    }

    getSeverity(role: string) {
        switch (role) {
            case 'super_admin':
                return 'danger';
            case 'Administrador':
                return 'info';
            case 'Vendedor':
                return 'warn';
            case 'Logistica':
                return 'success';
            case 'Contabilidad':
                return 'contrast';
            default:
                return 'secondary';
        }
    }
}
