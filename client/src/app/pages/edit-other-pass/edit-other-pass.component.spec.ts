import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOtherPassComponent } from './edit-other-pass.component';

describe('EditOtherPassComponent', () => {
  let component: EditOtherPassComponent;
  let fixture: ComponentFixture<EditOtherPassComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditOtherPassComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditOtherPassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
