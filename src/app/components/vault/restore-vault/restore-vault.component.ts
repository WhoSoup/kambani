/// <reference types="chrome" />

import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { ResultModel } from 'src/app/core/models/result.model';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-restore-vault',
  templateUrl: './restore-vault.component.html',
  styleUrls: ['./restore-vault.component.scss']
})
export class RestoreVaultComponent implements OnInit {
  public backupPasswordForm;
  public file: string;

  constructor(
    private fb: FormBuilder,
    private vaultService: VaultService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private router: Router) { }

  ngOnInit() {
    chrome.tabs.getCurrent(function(tab) {
      if (tab === undefined) {
        chrome.runtime.getPlatformInfo(function(info) {
          if (info.os !== 'win') {
            chrome.runtime.sendMessage({type: ChromeMessageType.RestoreVaultRequest}, (response) => {
              if (response.success) {
                const popup_url = chrome.runtime.getURL('index.html');
                chrome.tabs.create({'url': popup_url});
              }
            });
          }
        });
      } else {
        chrome.runtime.sendMessage({type: ChromeMessageType.CheckRequests}, (response) => {
          if (response.restoreVaultRequested) {
            chrome.runtime.sendMessage({type: ChromeMessageType.NewTabOpen});
          }
        });
      }
    });

    this.backupPasswordForm = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  importVault() {
    if (this.backupPasswordForm.invalid || !this.file) {
      return;
    }

    this.spinner.show();
    this.vaultService
      .restoreVault(this.file, this.password.value)
      .subscribe((result: ResultModel) => {
        if (result.success) {
          this.spinner.hide();
          this.toastr.success(result.message);
          this.router.navigate(['home']);
        } else {
          this.spinner.hide();
          this.toastr.error(result.message);
          this.backupPasswordForm.reset();
        }
      });
  }

  get password () {
    return this.backupPasswordForm.get('password');
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
