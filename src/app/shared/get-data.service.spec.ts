import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Certificate } from '../certificates/models/certificate';
import { GetDataService } from './get-data.service';
import { Projects } from './project';

let mockProjects: Projects[] = [
  {
    title: 'Full e-commerce',
    img: '../../assets/images/projects/js-amazona.jpeg',
    caption: 'Plataforma de e-commerce completa desenvolvida com vanilla JS',
    description:
      'Desenvolvido desde o front-end até o back end com JavaScript, tento todo processo de seleção e compra da mercadoria, empregando diversas tecnologias.',
    link: 'https://github.com/SamyrOR/full-ecommerce',
  },
  {
    title: 'Games Info',
    img: '../../assets/images/projects/games-info.jpeg',
    caption: 'Aplicação em Angular com consumo de uma API de jogos',
    description:
      'Plataforma para pesquisa de jogos, com detalhes do jogo selecionado, desenvolvida com as melhores práticas em Angular.',
    link: 'https://github.com/SamyrOR/games-info',
  },
];

let mockCertificates: Certificate[] = [
  {
    name: 'Digital Innovation One',
    certificates: [
      {
        name: 'Lógica de programação essencial',
        img: '../../assets/images/certificates/dio-logica.jpg',
        link: 'https://certificates.digitalinnovation.one/035F6F4D',
      },
    ],
  },
];

describe('GetDataService', () => {
  let service: GetDataService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [HttpClientModule],
    providers: [GetDataService, HttpClient, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}{
    imports: [HttpClientTestingModule],
    providers: [GetDataService, HttpClient, provideHttpClient(withInterceptorsFromDi())]
});
    service = TestBed.inject(GetDataService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should get projects json', () => {
    service.getProjects().subscribe((projectsData) => {
      expect(projectsData[0].title).toBe('Full e-commerce');
      expect(projectsData[1].title).toBe('Games Info');
    });

    const req = httpTestingController.expectOne('assets/data/projects.json');
    req.flush(mockProjects);
  });

  it('should get certificates json', () => {
    service.getCertificates().subscribe((certificatesData) => {
      expect(certificatesData[0].name).toBe('Digital Innovation One');
    });

    const req = httpTestingController.expectOne(
      'assets/data/certificates.json'
    );
    req.flush(mockCertificates);
  });
});
