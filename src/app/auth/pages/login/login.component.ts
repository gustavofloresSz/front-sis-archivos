import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-login',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  showPassword: boolean = false;
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  loginError: string | null = null;

  loginForm = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', Validators.required],
  });

  login() {
    if (this.loginForm.invalid) return;
    const formValue = this.loginForm.getRawValue(); 
    this.authService.login(formValue).subscribe({
      next: (success) => {
        if (success) {
          this.loginError = null;
          this.router.navigateByUrl('/main');
        } else {
          this.loginError = 'Usuario o contraseña incorrectos';
        }
      },
      error: (err) => {
        console.error('Error inesperado:', err);
        this.loginError = 'Ocurrió un error inesperado';
      }
    });
  }

  verPassword() {
    this.showPassword = !this.showPassword;
  }
}
