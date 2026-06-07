/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CatholicMovement } from '../types';

export interface CatholicEvent {
  id: string;
  title: string;
  movement: CatholicMovement | string;
  dateStr: string; // YYYY-MM-DD
  endDateStr?: string; // YYYY-MM-DD (Optional for multi-day events)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  description: string;
  tipo: string;
  city: string;
  instagramUrl?: string;
  instagramImgUrl?: string;
}

export const SEEDED_CATHOLIC_EVENTS: CatholicEvent[] = [
  {
    id: 'cat-1',
    title: 'Missa Solene do Sagrado Coração de Jesus',
    movement: CatholicMovement.PAROQUIAL,
    dateStr: '2026-06-12',
    startTime: '19:30',
    endTime: '21:00',
    location: 'Santuário do Sagrado Coração, Lorena',
    description: 'Celebração litúrgica solene dedicada ao Sagrado Coração de Jesus. Consagração das famílias.',
    tipo: 'encontro',
    city: 'Lorena'
  },
  {
    id: 'cat-2',
    title: 'Vigília dos Adoradores RCC',
    movement: CatholicMovement.RCC,
    dateStr: '2026-06-06',
    startTime: '22:00',
    endTime: '23:59',
    location: 'Catedral Divino Espírito Santo, São Paulo',
    description: 'Vigília diocesana com louvor carismático, adoração guiada ao Santíssimo Sacramento e intercessão.',
    tipo: 'vigilia',
    city: 'São Paulo',
    instagramUrl: 'https://www.instagram.com/p/C5_m0UFO7I2/',
    instagramImgUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cat-3',
    title: 'Luau com Cristo - Jovens Shalom',
    movement: CatholicMovement.SHALOM,
    dateStr: '2026-06-06',
    startTime: '19:00',
    endTime: '22:00',
    location: 'Orla da Represa, São José dos Campos',
    description: 'Momento de fraternidade, música acústica e louvor jovem ao ar livre com adoração ao redor do fogo.',
    tipo: 'luau',
    city: 'São José dos Campos',
    instagramUrl: 'https://www.instagram.com/p/C4gL_r_u0-z/',
    instagramImgUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cat-4',
    title: 'Retiro Espiritual Mariano EJNS',
    movement: CatholicMovement.EJNS,
    dateStr: '2026-06-07',
    startTime: '08:00',
    endTime: '17:00',
    location: 'Sítio Recanto de Maria, Campinas',
    description: 'Retiro espiritual para as Equipes de Jovens de Nossa Senhora. Partilha da Carta Mensal e Deserto.',
    tipo: 'retiro',
    city: 'Campinas',
    instagramUrl: 'https://www.instagram.com/p/C5R7Nguux-C/',
    instagramImgUrl: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cat-5',
    title: 'Adoração pelas Vocações e Terço Solene',
    movement: CatholicMovement.TERCO_HOMENS,
    dateStr: '2026-06-08',
    startTime: '20:00',
    endTime: '21:30',
    location: 'Paróquia São Bento, Lorena',
    description: 'Encontro paroquial de homens para rezar o terço e clamar pelas vocações sacerdotais e religiosas.',
    tipo: 'adoracao',
    city: 'Lorena'
  },
  {
    id: 'cat-6',
    title: 'Ação Social Vicentina de Inverno',
    movement: CatholicMovement.VINCENTINOS,
    dateStr: '2026-06-13',
    startTime: '08:30',
    endTime: '12:00',
    location: 'Sede Vicentina, Rio de Janeiro',
    description: 'Grande mutirão para triagem e distribuição de agasalhos e cobertores para pessoas em situação de rua.',
    tipo: 'encontro',
    city: 'Rio de Janeiro'
  },
  {
    id: 'cat-7',
    title: 'Noite de Louvor e Clamor Canção Nova',
    movement: CatholicMovement.CANCAO_NOVA,
    dateStr: '2026-06-15',
    startTime: '19:00',
    endTime: '21:30',
    location: 'Auditório São Paulo, Cachoeira Paulista',
    description: 'Noite carismática especial de louvor e oração com foca na restauração das famílias pelo poder do Espírito.',
    tipo: 'grupo',
    city: 'Cachoeira Paulista'
  },
  {
    id: 'cat-8',
    title: 'Acampamento PHN 2026 (Por Hoje Não Vou Pecar)',
    movement: CatholicMovement.CANCAO_NOVA,
    dateStr: '2026-06-19',
    startTime: '18:00',
    endTime: '22:00',
    location: 'Sede Canção Nova, Cachoeira Paulista',
    description: 'Início do maior acampamento de jovens da América Latina. Shows de música carismática e pregações.',
    tipo: 'acampamento',
    city: 'Cachoeira Paulista'
  },
  {
    id: 'cat-9',
    title: 'Seminário de Vida no Espírito Santo',
    movement: CatholicMovement.RCC,
    dateStr: '2026-06-21',
    startTime: '14:00',
    endTime: '18:00',
    location: 'Salão da Igreja São José, Lorena',
    description: 'Encontro com palestras dinâmicas, dinâmicas de evangelização e louvores ungidos. Batismo no Espírito.',
    tipo: 'seminario',
    city: 'Lorena'
  },
  {
    id: 'cat-10',
    title: 'Missa de Envio Jovem',
    movement: CatholicMovement.PAROQUIAL,
    dateStr: '2026-06-14',
    startTime: '18:00',
    endTime: '19:30',
    location: 'Igreja Santa Rita de Cássia, São Paulo',
    description: 'Celebração paroquial com bênção e envio de missionários juvenis para as missões rurais de férias.',
    tipo: 'encontro',
    city: 'São Paulo'
  },
  {
    id: 'cat-11',
    title: 'Cenáculo Mariano Paroquial',
    movement: CatholicMovement.PAROQUIAL,
    dateStr: '2026-06-16',
    startTime: '15:00',
    endTime: '17:00',
    location: 'Capela Divina Providência, Campinas',
    description: 'Tarde dedicada à recitação mediatada das dezenas do rosário, orações bíblicas e consagração ao Imaculado Coração.',
    tipo: 'adoracao',
    city: 'Campinas'
  },
  {
    id: 'cat-12',
    title: 'Encontro de Casais de Equipes ENS',
    movement: CatholicMovement.EJNS,
    dateStr: '2026-06-20',
    startTime: '16:00',
    endTime: '21:00',
    location: 'Salão Santa Maria, Lorena',
    description: 'Jornada paroquial de partilhas e reflexão familiar das Equipes de Nossa Senhora da região do Vale.',
    tipo: 'encontro',
    city: 'Lorena'
  },
  {
    id: 'cat-13',
    title: 'Grupo de Oração Avivando a Fé',
    movement: CatholicMovement.RCC,
    dateStr: '2026-06-27',
    startTime: '19:30',
    endTime: '21:30',
    location: 'Capela da Glória, Rio de Janeiro',
    description: 'Sábado semanal de partilha da Palavra, cura interior e cânticos inflamados com a Renovação Carismática.',
    tipo: 'grupo',
    city: 'Rio de Janeiro'
  },
  {
    id: 'cat-14',
    title: 'Adoração Noturna Jovem de Pentecostes',
    movement: CatholicMovement.SHALOM,
    dateStr: '2026-06-28',
    startTime: '21:00',
    endTime: '23:30',
    location: 'Centro de Evangelização, São Paulo',
    description: 'Momento profundo de adoração silenciosa e contemplação eucarística, clamando pelos dons do Espírito Santo.',
    tipo: 'adoracao',
    city: 'São Paulo'
  },
  {
    id: 'cat-future-1',
    title: 'Acampamento de Jovens Sentinelas 2026',
    movement: CatholicMovement.RCC,
    dateStr: '',
    startTime: '18:00',
    endTime: '22:00',
    location: 'Chácara de Evangelização Canção Nova, Queluz',
    description: 'Encontro anual de espiritualidade juvenil carismática. Datas e pregadores presenciais a definir brevemente.',
    tipo: 'acampamento',
    city: 'Queluz',
    instagramImgUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cat-future-2',
    title: 'Retiro Regional de Espiritualidade EJNS',
    movement: CatholicMovement.EJNS,
    dateStr: '',
    startTime: '08:00',
    endTime: '18:00',
    location: 'Casa de Retiro São Bento, Taubaté',
    description: 'Um dia de recolhimento, adoração mariana e partilha guiada para os jovens casais e conselheiros espirituais das Equipes de Nossa Senhora.',
    tipo: 'retiro',
    city: 'Taubaté',
    instagramImgUrl: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'cat-future-3',
    title: 'Grande Intercâmbio das Comunidades Shalom',
    movement: CatholicMovement.SHALOM,
    dateStr: '',
    startTime: '14:00',
    endTime: '20:00',
    location: 'Centro de Evangelização Shalom do Setor Leste',
    description: 'Tarde de confraternização, workshops comunitários, partilha carismática e noite de luau a confirmar no segundo semestre de 2026.',
    tipo: 'encontro',
    city: 'Lorena'
  }
];
