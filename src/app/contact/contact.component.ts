import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, TranslatePipe]
})
export class ContactComponent {
  private fb = inject(FormBuilder);

  form: FormGroup<{
    subject: FormControl<string>;
    message: FormControl<string>;
  }> = this.fb.nonNullable.group({
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });
  submitted = signal(false);

  sendMail() {
    this.submitted.set(true);
    if (this.form.valid) {
      const { subject, message } = this.form.getRawValue();
      const link = `mailto:saamyr@live.com?subject=${encodeURI(
        subject
      )}&body=${encodeURI(message)}`;
      window.location.href = link;
    }
  }

  get formControls() {
    return this.form.controls;
  }
}
