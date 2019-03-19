import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from '../../dialogs/password/password.dialog.component';
import { SignatureType } from 'src/app/core/enums/signature-type';

@Component({
  selector: 'app-import-keys',
  templateUrl: './import-keys.component.html',
  styleUrls: ['./import-keys.component.scss']
})
export class ImportKeysComponent implements OnInit {
  protected importType: string;
  protected jsonFilePasswordForm: FormGroup;
  protected privateKeyForm: FormGroup;
  protected file: string;

  constructor(
    private fb: FormBuilder,
    private dialogsService: DialogsService,
    private keysService: KeysService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService ) { }

  ngOnInit() {
    this.createJsonFilePasswordForm();
    this.createPrivateKeyForm();
  }

  createJsonFilePasswordForm() {
    this.jsonFilePasswordForm = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  createPrivateKeyForm() {
    this.privateKeyForm = this.fb.group({
      type: [SignatureType.EdDSA, Validators.required],
      alias: ['', Validators.required],
      privateKey: ['', [Validators.required]]
    });
  }

  importJsonFile() {
    if (this.jsonFilePasswordForm.invalid || !this.file) {
      return;
    }

    const dialogMessage = 'Enter your vault password to import the keys';
    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.Small, dialogMessage)
      .subscribe((vaultPassword: string) => {
        const filePassword = this.password.value;
        this.jsonFilePasswordForm.reset();

        if (vaultPassword) {
          this.spinner.show();
          this.keysService
            .importFromJsonFile(this.file, filePassword, vaultPassword)
            .subscribe(result => {
              this.spinner.hide();
              if (result.success) {
                this.toastr.success(result.message);
                this.router.navigate(['home']);
              } else {
                this.toastr.error(result.message);
              }
            });

          this.createJsonFilePasswordForm();
        }
      });
  }

  importPrivateKey() {
    if (this.privateKeyForm.invalid) {
      return;
    }

    const dialogMessage = 'Enter your vault password to import the key';
    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.Small, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();
          this.keysService
            .importFromPrivateKey(this.alias.value, this.type.value, this.privateKey.value, vaultPassword)
            .subscribe(result => {
              this.spinner.hide();
              if (result.success) {
                this.toastr.success(result.message);
                this.router.navigate(['home']);
              } else {
                this.toastr.error(result.message);
              }
            });

          this.createPrivateKeyForm();
        }
      });
  }

  get password () {
    return this.jsonFilePasswordForm.get('password');
  }

  get type() {
    return this.privateKeyForm.get('type');
  }

  get alias() {
    return this.privateKeyForm.get('alias');
  }

  get privateKey () {
    return this.privateKeyForm.get('privateKey');
  }

  handleFileInput(files) {
    if (files && files.length > 0) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        this.file = fileReader.result.toString();
      };

      fileReader.readAsText(files[0]);
    }
  }
}
