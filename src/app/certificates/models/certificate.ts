//Certificates model
export interface Certificate {
  name: string;
  certificates: [
    {
      name: string;
      img: string;
      link: string;
    }
  ];
}
