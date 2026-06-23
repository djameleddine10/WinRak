export const mockPassengers = [
  {
    id: 'p001',
    name: 'جمال الدين',
    nameLatin: 'Djamel Eddine',
    firstName: 'جمال الدين',
    lastName: 'تروضي',
    avatar: 'ج',
    phone: '+213671234567',
    phoneMasked: '213*******33',
    email: 'djameleddine@gmail.com',
    rating: 4.8,
    totalRides: 47,
    gender: 'male',
    birthDate: '1995-03-15',
    city: 'الجزائر العاصمة',
    photoStatus: 'missing',
    registrationStep: 1,
    savedPlaces: {
      home: {
        name: 'البيت',
        address: 'حي السلام، باب الوادي، الجزائر',
        lat: 36.7538,
        lng: 3.0488,
      },
      work: {
        name: 'العمل',
        address: 'شارع ديدوش مراد، الجزائر',
        lat: 36.7400,
        lng: 3.0600,
      },
    },
    wallet: { balance: 2450, points: 840 },
    paymentMethods: [
      { id: 'pm1', type: 'cib',      label: 'CIB',      last4: '4521', isDefault: true  },
      { id: 'pm2', type: 'edahabia', label: 'Edahabia', last4: '8833', isDefault: false },
      { id: 'pm3', type: 'cash',     label: 'نقداً',    last4: null,   isDefault: false },
    ],
    emergencyContacts: [
      { name: 'الأم', phone: '+213670000001' },
      { name: 'الأب', phone: '+213670000002' },
    ],
  },
]

export const currentUser = mockPassengers[0]
export type Passenger = typeof mockPassengers[number]
