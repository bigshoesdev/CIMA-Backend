import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPassComponent } from './add-pass.component';

describe('AddPassComponent', () => {
  let component: AddPassComponent;
  let fixture: ComponentFixture<AddPassComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddPassComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
