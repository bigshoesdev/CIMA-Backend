import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingRentalComponent } from './pending-rental.component';

describe('PendingRentalComponent', () => {
  let component: PendingRentalComponent;
  let fixture: ComponentFixture<PendingRentalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PendingRentalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingRentalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
