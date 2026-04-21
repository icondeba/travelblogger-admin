import { Routes } from '@angular/router';
import { AdminLoginComponent } from './auth/admin-login.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AboutEditorComponent } from './about/about-editor.component';
import { StoriesListComponent } from './stories/stories-list.component';
import { StoryEditorComponent } from './stories/story-editor.component';
import { ContactListComponent } from './contact/contact-list.component';
import { EventsListComponent } from './events/events-list.component';
import { EventEditorComponent } from './events/event-editor.component';
import { AwardsListComponent } from './awards/awards-list.component';
import { AwardEditorComponent } from './awards/award-editor.component';
import { MilestonesListComponent } from './milestones/milestones-list.component';
import { MilestoneEditorComponent } from './milestones/milestone-editor.component';
import { AuthGuard } from '../guards/auth.guard';

export const adminRoutes: Routes = [
  { path: 'login', component: AdminLoginComponent },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'about', component: AboutEditorComponent },
      { path: 'stories', component: StoriesListComponent },
      { path: 'stories/new', component: StoryEditorComponent },
      { path: 'stories/edit/:id', component: StoryEditorComponent },
      { path: 'events', component: EventsListComponent },
      { path: 'events/new', component: EventEditorComponent },
      { path: 'events/edit/:id', component: EventEditorComponent },
      { path: 'awards', component: AwardsListComponent },
      { path: 'awards/new', component: AwardEditorComponent },
      { path: 'awards/edit/:id', component: AwardEditorComponent },
      { path: 'milestones', component: MilestonesListComponent },
      { path: 'milestones/new', component: MilestoneEditorComponent },
      { path: 'milestones/edit/:id', component: MilestoneEditorComponent },
      { path: 'contact', component: ContactListComponent },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  }
];
