import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ContactComponent implements OnInit {
  private fb = inject(UntypedFormBuilder);

  form!: UntypedFormGroup;
  submitted = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  sendMail() {
    this.submitted = true;
    if (this.form.valid) {
      const subject = (document.querySelector('.form__input') as HTMLInputElement)
        .value;
      const message = (document.querySelector('.form__textarea') as HTMLInputElement).value;
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
