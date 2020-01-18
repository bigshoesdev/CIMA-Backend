import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSeasonPassComponent } from './edit-season-pass.component';

describe('EditSeasonPassComponent', () => {
  let component: EditSeasonPassComponent;
  let fixture: ComponentFixture<EditSeasonPassComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditSeasonPassComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSeasonPassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
