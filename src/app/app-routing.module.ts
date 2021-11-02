import { Host, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './regular/home/home.component';
import { NotFoundComponent } from './regular/not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, data: { title: 'Home' } },
  {
    path: 'certificates',
    loadChildren: () =>
      import('./certificates/certificates.module').then(
        (m) => m.CertificatesModule
      ),
  },
  {
    path: 'projects',
    loadChildren: () =>
      import('./projects/projects.module').then((m) => m.ProjectsModule),
  },
  {
    path: 'about-me',
    loadChildren: () =>
      import('./about-me/about-me.module').then((m) => m.AboutMeModule),
  },
  {
    path: 'contact',
    loadChildren: () =>
      import('./contact/contact.module').then((m) => m.ContactModule),
  },

  {
    path: '**',
    component: NotFoundComponent,
    data: { title: '404' },
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
