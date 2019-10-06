import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { RemoveVaultDialogComponent } from '../dialogs/remove-vault/remove-vault.dialog.component';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { SigningService } from 'src/app/core/services/signing/signing.service';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public pendingRequestsCount = 0;

  constructor(
    private dialogsService: DialogsService,
    private router: Router,
    private signingService: SigningService,
    private vaultService: VaultService) { }

  ngOnInit() {

    chrome.browserAction && chrome.browserAction.getBadgeText({}, (result) => {
      this.pendingRequestsCount = parseInt(result, 10);
    });

    this.signingService.change.subscribe(pendingRequestsCount => {
      this.pendingRequestsCount = pendingRequestsCount;
    });
  }

  removeVault() {
    this.dialogsService.open(RemoveVaultDialogComponent, ModalSizeTypes.ExtraExtraLarge, null)
      .subscribe((response: string) => {
        if (response === 'confirm') {
          this.vaultService.removeVault();
          this.router.navigate(['/vault/create']);
        }
      });
  }
}
