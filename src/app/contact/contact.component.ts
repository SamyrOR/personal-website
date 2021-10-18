import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent implements OnInit {
  form!: FormGroup;
  submitted: boolean = false;
  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  sendMail() {
    this.submitted = true;
    if (this.form.valid) {
      let subject = (<HTMLInputElement>document.querySelector('.form__input'))
        .value;
      let message = (<HTMLInputElement>(
        document.querySelector('.form__textarea')
      )).value;
      let link = `mailto:saamyr@live.com?subject=${encodeURI(
        subject
      )}&body=${encodeURI(message)}`;
      window.location.href = link;
    }
  }

  get formControls() {
    return this.form.controls;
  }
}
