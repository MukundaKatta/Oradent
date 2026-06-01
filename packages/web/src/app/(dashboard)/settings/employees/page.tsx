'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Users,
  Phone,
  Mail,
  X,
  ChevronRight,
  User,
  Filter,
  MapPin,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════ TYPES ═══════════════════

type EmployeeRole = 'Dentist' | 'Hygienist' | 'Assistant' | 'Front Desk';
type EmployeeStatus = 'Active' | 'Inactive';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: EmployeeRole;
  email: string;
  phone: string;
  status: EmployeeStatus;
  department: string;
  specialty: string[];
  hireDate: string;
  npi?: string;
  licenseNumber?: string;
  bio: string;
  schedule: string;
}

// ═══════════════════ CONSTANTS ═══════════════════

const ROLE_COLORS: Record<EmployeeRole, string> = {
  Dentist: 'bg-teal-100 text-teal-700',
  Hygienist: 'bg-blue-100 text-blue-700',
  Assistant: 'bg-purple-100 text-purple-700',
  'Front Desk': 'bg-amber-100 text-amber-700',
};

const ROLE_BG: Record<EmployeeRole, string> = {
  Dentist: 'bg-teal-500',
  Hygienist: 'bg-blue-500',
  Assistant: 'bg-purple-500',
  'Front Desk': 'bg-amber-500',
};

const ALL_ROLES: EmployeeRole[] = ['Dentist', 'Hygienist', 'Assistant', 'Front Desk'];

// ═══════════════════ SEED DATA ═══════════════════

const EMPLOYEES: Employee[] = [
  {
    id: '1',
    firstName: 'Dr. Michael',
    lastName: 'Torres',
    role: 'Dentist',
    email: 'michael.torres@oradent.com',
    phone: '(555) 100-2001',
    status: 'Active',
    department: 'General Dentistry',
    specialty: ['Restorative', 'Cosmetic'],
    hireDate: '2019-03-15',
    npi: '1234567890',
    licenseNumber: 'DDS-2019-4521',
    bio: 'Dr. Torres has over 12 years of experience in general and cosmetic dentistry. He graduated from UCLA School of Dentistry and completed his residency at Cedars-Sinai.',
    schedule: 'Mon-Thu: 8:00 AM - 5:00 PM',
  },
  {
    id: '2',
    firstName: 'Dr. Lisa',
    lastName: 'Park',
    role: 'Dentist',
    email: 'lisa.park@oradent.com',
    phone: '(555) 100-2002',
    status: 'Active',
    department: 'Periodontics',
    specialty: ['Periodontics', 'Implants'],
    hireDate: '2020-07-01',
    npi: '0987654321',
    licenseNumber: 'DDS-2020-7832',
    bio: 'Dr. Park specializes in periodontal disease treatment and dental implant placement. She is board-certified in periodontics with fellowship training in implantology.',
    schedule: 'Mon, Wed, Fri: 8:00 AM - 5:00 PM',
  },
  {
    id: '3',
    firstName: 'Jennifer',
    lastName: 'Adams',
    role: 'Hygienist',
    email: 'jennifer.adams@oradent.com',
    phone: '(555) 100-2003',
    status: 'Active',
    department: 'Hygiene',
    specialty: ['Preventive Care', 'Pediatric Hygiene'],
    hireDate: '2021-01-10',
    licenseNumber: 'RDH-2021-1145',
    bio: 'Jennifer is a registered dental hygienist with expertise in preventive care and pediatric patients. She holds a BS in Dental Hygiene from USC.',
    schedule: 'Mon-Fri: 8:00 AM - 4:00 PM',
  },
  {
    id: '4',
    firstName: 'Marcus',
    lastName: 'Williams',
    role: 'Hygienist',
    email: 'marcus.williams@oradent.com',
    phone: '(555) 100-2004',
    status: 'Active',
    department: 'Hygiene',
    specialty: ['Periodontal Maintenance', 'Whitening'],
    hireDate: '2022-04-20',
    licenseNumber: 'RDH-2022-3367',
    bio: 'Marcus brings 8 years of hygiene experience with a focus on periodontal maintenance therapy and professional teeth whitening procedures.',
    schedule: 'Tue-Sat: 9:00 AM - 5:00 PM',
  },
  {
    id: '5',
    firstName: 'Sophia',
    lastName: 'Chen',
    role: 'Assistant',
    email: 'sophia.chen@oradent.com',
    phone: '(555) 100-2005',
    status: 'Active',
    department: 'Clinical',
    specialty: ['Surgical Assisting', 'Digital Imaging'],
    hireDate: '2021-08-15',
    licenseNumber: 'CDA-2021-8890',
    bio: 'Sophia is a certified dental assistant specializing in surgical assisting and digital radiography. She ensures smooth workflow during complex procedures.',
    schedule: 'Mon-Thu: 7:30 AM - 4:30 PM',
  },
  {
    id: '6',
    firstName: 'David',
    lastName: 'Kim',
    role: 'Assistant',
    email: 'david.kim@oradent.com',
    phone: '(555) 100-2006',
    status: 'Active',
    department: 'Clinical',
    specialty: ['Orthodontic Assisting', 'Sterilization'],
    hireDate: '2023-02-01',
    licenseNumber: 'CDA-2023-1122',
    bio: 'David assists in orthodontic and general dental procedures. He is responsible for instrument sterilization protocols and patient comfort management.',
    schedule: 'Mon-Fri: 8:00 AM - 4:30 PM',
  },
  {
    id: '7',
    firstName: 'Rachel',
    lastName: 'Green',
    role: 'Front Desk',
    email: 'rachel.green@oradent.com',
    phone: '(555) 100-2007',
    status: 'Active',
    department: 'Administration',
    specialty: ['Insurance Verification', 'Scheduling'],
    hireDate: '2020-11-01',
    bio: 'Rachel manages front desk operations including patient scheduling, insurance verification, and billing inquiries. She has 6 years of dental office management experience.',
    schedule: 'Mon-Fri: 7:30 AM - 5:00 PM',
  },
  {
    id: '8',
    firstName: 'Amanda',
    lastName: 'Foster',
    role: 'Front Desk',
    email: 'amanda.foster@oradent.com',
    phone: '(555) 100-2008',
    status: 'Active',
    department: 'Administration',
    specialty: ['Patient Relations', 'Billing'],
    hireDate: '2024-01-15',
    bio: 'Amanda handles patient check-in/check-out, appointment confirmations, and payment processing. She excels at patient communication and customer service.',
    schedule: 'Mon-Fri: 8:00 AM - 5:00 PM',
  },
  {
    id: '9',
    firstName: 'Dr. Robert',
    lastName: 'Chang',
    role: 'Dentist',
    email: 'robert.chang@oradent.com',
    phone: '(555) 100-2009',
    status: 'Inactive',
    department: 'Endodontics',
    specialty: ['Endodontics', 'Microsurgery'],
    hireDate: '2018-06-01',
    npi: '1122334455',
    licenseNumber: 'DDS-2018-6677',
    bio: 'Dr. Chang specialized in endodontic procedures and microsurgical techniques. He is currently on extended leave.',
    schedule: 'N/A - On Leave',
  },
  {
    id: '10',
    firstName: 'Karen',
    lastName: 'Martinez',
    role: 'Hygienist',
    email: 'karen.martinez@oradent.com',
    phone: '(555) 100-2010',
    status: 'Inactive',
    department: 'Hygiene',
    specialty: ['Geriatric Care'],
    hireDate: '2019-09-10',
    licenseNumber: 'RDH-2019-4456',
    bio: 'Karen specialized in geriatric dental hygiene care. She is currently inactive.',
    schedule: 'N/A - Inactive',
  },
];

// ═══════════════════ SKELETON ═══════════════════

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-xl bg-stone-200" />
      ))}
    </div>
  );
}

// ═══════════════════ MAIN PAGE ═══════════════════

export default function EmployeeDirectoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Simulate loading
  useState(() => {
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  });

  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.specialty.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (roleFilter) {
      result = result.filter((e) => e.role === roleFilter);
    }
    if (statusFilter) {
      result = result.filter((e) => e.status === statusFilter);
    }
    return result.sort((a, b) => `${a.lastName}`.localeCompare(`${b.lastName}`));
  }, [employees, search, roleFilter, statusFilter]);

  const handleToggleStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: (e.status === 'Active' ? 'Inactive' : 'Active') as EmployeeStatus }
          : e
      )
    );
    setSelectedEmployee((prev) =>
      prev && prev.id === id
        ? { ...prev, status: (prev.status === 'Active' ? 'Inactive' : 'Active') as EmployeeStatus }
        : prev
    );
  };

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_ROLES.forEach((r) => {
      counts[r] = employees.filter((e) => e.role === r && e.status === 'Active').length;
    });
    return counts;
  }, [employees]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Employee Directory</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage staff information and roles
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Users className="h-4 w-4" />
          <span>
            {employees.filter((e) => e.status === 'Active').length} active employees
          </span>
        </div>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ALL_ROLES.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
            className={cn(
              'rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md',
              roleFilter === role
                ? 'border-teal-400 ring-1 ring-teal-400'
                : 'border-stone-200'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg text-white',
                  ROLE_BG[role]
                )}
              >
                {role === 'Dentist' && <Stethoscope className="h-4 w-4" />}
                {role === 'Hygienist' && <User className="h-4 w-4" />}
                {role === 'Assistant' && <User className="h-4 w-4" />}
                {role === 'Front Desk' && <Users className="h-4 w-4" />}
              </div>
              <div className="text-left">
                <p className="text-xs text-stone-500">{role}s</p>
                <p className="text-lg font-bold text-stone-900">{roleCounts[role]}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department, or specialty..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">All Roles</option>
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Content: Grid + Side Panel */}
      <div className="flex gap-6">
        {/* Employee Grid */}
        <div className={cn('flex-1', selectedEmployee && 'max-w-[calc(100%-380px)]')}>
          {isLoading ? (
            <CardGridSkeleton />
          ) : filteredEmployees.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white py-16 text-center shadow-sm">
              <Users className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No employees found</h3>
              <p className="mt-1 text-xs text-stone-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className={cn(
                    'group rounded-xl border bg-white p-5 text-left shadow-sm transition-all hover:shadow-md',
                    selectedEmployee?.id === employee.id
                      ? 'border-teal-400 ring-1 ring-teal-400'
                      : 'border-stone-200'
                  )}
                >
                  {/* Photo Placeholder */}
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full text-white text-sm font-bold',
                        employee.status === 'Inactive' ? 'bg-stone-400' : ROLE_BG[employee.role]
                      )}
                    >
                      {employee.firstName.charAt(0)}
                      {employee.lastName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-stone-900">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          ROLE_COLORS[employee.role]
                        )}
                      >
                        {employee.role}
                      </span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5 text-xs text-stone-500">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{employee.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span>{employee.department}</span>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {employee.specialty.map((spec) => (
                      <span
                        key={spec}
                        className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium',
                        employee.status === 'Active' ? 'text-green-600' : 'text-stone-400'
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          employee.status === 'Active' ? 'bg-green-500' : 'bg-stone-400'
                        )}
                      />
                      {employee.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Side Panel */}
        {selectedEmployee && (
          <div className="w-[360px] flex-shrink-0 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-14 w-14 items-center justify-center rounded-full text-white text-lg font-bold',
                    selectedEmployee.status === 'Inactive'
                      ? 'bg-stone-400'
                      : ROLE_BG[selectedEmployee.role]
                  )}
                >
                  {selectedEmployee.firstName.charAt(0)}
                  {selectedEmployee.lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      ROLE_COLORS[selectedEmployee.role]
                    )}
                  >
                    {selectedEmployee.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Toggle */}
            <div className="mt-5 flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3">
              <span className="text-sm font-medium text-stone-700">Status</span>
              <button
                onClick={() => handleToggleStatus(selectedEmployee.id)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  selectedEmployee.status === 'Active' ? 'bg-green-500' : 'bg-stone-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    selectedEmployee.status === 'Active' ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Details */}
            <div className="mt-5 space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Contact
                </h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Mail className="h-4 w-4 text-stone-400" />
                    <span>{selectedEmployee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Phone className="h-4 w-4 text-stone-400" />
                    <span>{selectedEmployee.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Department
                </h3>
                <p className="mt-1 text-sm text-stone-700">{selectedEmployee.department}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Specialties
                </h3>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {selectedEmployee.specialty.map((spec) => (
                    <span
                      key={spec}
                      className="rounded-md bg-stone-100 px-2 py-1 text-xs font-medium text-stone-600"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Schedule
                </h3>
                <p className="mt-1 text-sm text-stone-700">{selectedEmployee.schedule}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Hire Date
                </h3>
                <p className="mt-1 text-sm text-stone-700">
                  {new Date(selectedEmployee.hireDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {selectedEmployee.licenseNumber && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                    License
                  </h3>
                  <p className="mt-1 text-sm text-stone-700">{selectedEmployee.licenseNumber}</p>
                </div>
              )}

              {selectedEmployee.npi && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                    NPI
                  </h3>
                  <p className="mt-1 text-sm text-stone-700">{selectedEmployee.npi}</p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Bio
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  {selectedEmployee.bio}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
