import { Routes } from "@angular/router";
import { HomeComponent } from "./regular/home/home.component";
import { NotFoundComponent } from "./regular/not-found/not-found.component";

export const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "home", component: HomeComponent, data: { title: "Home" } },
  {
    path: "certificates",
    loadComponent: () =>
      import("./certificates/certificates.component").then(
        (m) => m.CertificatesComponent,
      ),
    data: { title: "Certificados" },
  },
  {
    path: "projects",
    loadComponent: () =>
      import("./projects/projects.component").then((m) => m.ProjectsComponent),
    data: { title: "Projetos" },
  },
  {
    path: "about-me",
    loadComponent: () =>
      import("./about-me/about-me.component").then((m) => m.AboutMeComponent),
    data: { title: "Sobre mim" },
  },
  {
    path: "contact",
    loadComponent: () =>
      import("./contact/contact.component").then((m) => m.ContactComponent),
    data: { title: "Contato" },
  },

  {
    path: "**",
    component: NotFoundComponent,
    data: { title: "404" },
  },
];
