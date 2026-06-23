export const mockPlaces = [
  { id: 'pl01', name: 'مطار هواري بومدين',       address: 'طريق المطار، الجزائر',  lat: 36.6910, lng: 3.2150, type: 'airport'    },
  { id: 'pl02', name: 'ساحة الشهداء',            address: 'وسط المدينة، الجزائر',  lat: 36.7339, lng: 3.0508, type: 'landmark'   },
  { id: 'pl03', name: 'جامعة USTHB',             address: 'بن عكنون، الجزائر',     lat: 36.7074, lng: 3.0298, type: 'university' },
  { id: 'pl04', name: 'مركز تجاري Bab Ezzouar',  address: 'باب الزوار، الجزائر',   lat: 36.7174, lng: 3.1827, type: 'mall'       },
  { id: 'pl05', name: 'مستشفى مصطفى باشا',       address: 'سيدي محمد، الجزائر',    lat: 36.7440, lng: 3.0570, type: 'hospital'   },
  { id: 'pl06', name: 'المجمع القضائي',          address: 'شارع ويلسون، الجزائر',  lat: 36.7380, lng: 3.0620, type: 'gov'        },
  { id: 'pl07', name: 'حي باب الوادي',           address: 'باب الوادي، الجزائر',   lat: 36.7600, lng: 3.0450, type: 'zone'       },
  { id: 'pl08', name: 'محطة الحامة',             address: 'الحامة، الجزائر',       lat: 36.7310, lng: 3.0480, type: 'station'    },
  { id: 'pl09', name: 'شارع ديدوش مراد',         address: 'الجزائر العاصمة',       lat: 36.7400, lng: 3.0600, type: 'street'     },
  { id: 'pl10', name: 'حديقة التجارب',           address: 'الحامة، الجزائر',       lat: 36.7280, lng: 3.0520, type: 'park'       },
]

export const popularIntercityRoutes = [
  { from: 'الجزائر', to: 'وهران',      distanceKm: 363, count: 22 },
  { from: 'الجزائر', to: 'قسنطينة',    distanceKm: 432, count: 16 },
  { from: 'الجزائر', to: 'عنابة',      distanceKm: 530, count: 11 },
  { from: 'الجزائر', to: 'سطيف',       distanceKm: 296, count: 9  },
  { from: 'الجزائر', to: 'بجاية',      distanceKm: 270, count: 8  },
  { from: 'قسنطينة', to: 'عين مليلة',  distanceKm: 38,  count: 5  },
  { from: 'قسنطينة', to: 'سكيكدة',     distanceKm: 88,  count: 5  },
]

export const recentPlaces = [mockPlaces[1], mockPlaces[0], mockPlaces[3]]

export type Place = typeof mockPlaces[number]
