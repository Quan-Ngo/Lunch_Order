import { useMemo, useState } from 'react';
import { RootLayout } from '@/layouts/RootLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { PageHeader } from '@/components/elements/PageHeader';
import { SoftCard } from '@/components/elements/SoftCard';
import { SearchBar } from '@/components/elements/SearchBar';
import { Table, type ColumnDef } from '@/components/elements/Table';
import { Badge } from '@/components/elements/Badge';
import { LoadingState } from '@/components/elements/LoadingState';
import { ErrorState } from '@/components/elements/ErrorState';
import { EmptyState } from '@/components/elements/EmptyState';
import { Button } from '@/components/elements/Button';
import type { StaffEntity } from '@/services/api';

const columns: ColumnDef<StaffEntity>[] = [
    {
        header: 'Name',
        key: 'name',
        className: 'col-span-4 text-sm font-semibold text-gray-800',
    },
    {
        header: 'Status',
        className: 'col-span-4',
        render: (row) => (
            <Badge variant={row.status ? 'success' : 'warning'}>
                {row.status ? 'Active' : 'Inactive'}
            </Badge>
        ),
    },
    {
        header: 'Actions',
        className: 'col-span-4 flex justify-end',
        render: () => (
            <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="border-0 bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-0 focus:ring-offset-0 shadow-none hover:shadow-none" onClick={() => { }}>
                    Grant Admin
                </Button>
                <Button variant="secondary" size="sm" className="border-0 bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-0 focus:ring-offset-0 shadow-none hover:shadow-none" onClick={() => { }}>
                    Edit
                </Button>
                <Button variant="danger" size="sm" className="shadow-none hover:shadow-none" onClick={() => { }}>
                    Delete
                </Button>
            </div>
        ),
    },
];

export default function Employees() {
    const { employees, isLoading, error } = useEmployees();
    const [searchTerm, setSearchTerm] = useState<string>('');

    const totalEmployees: number = employees?.length ?? 0;
    const filteredEmployees = useMemo(() => {
        if (!employees) return [];
        const query = searchTerm.toLowerCase().trim();
        if (!query) return employees;
        return employees.filter((employee) =>
            employee.name.toLowerCase().includes(query)
        );
    }, [employees, searchTerm]);

    return (
        <RootLayout>
            <PageHeader
                title="Manage Employees"
                description="Manage team access and account status for office lunches."
            >
                <Button
                    variant="primary"
                    icon={<span className="material-icons-outlined">person_add</span>}
                >
                    Register New Employee
                </Button>
            </PageHeader>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <SoftCard>
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Employees</p>
                    <p className="text-3xl font-extrabold font-display text-gray-900">{totalEmployees}</p>
                </SoftCard>
                <SoftCard>
                    <p className="text-sm text-gray-500 font-medium mb-1">Active Accounts</p>
                    <p className="text-3xl font-extrabold font-display text-gray-900">{totalEmployees}</p>
                </SoftCard>
            </div>

            <SoftCard className="mb-4">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search employees by name"
                    className="md:w-1/3"
                />
            </SoftCard>

            {/* Content states */}
            {isLoading && <LoadingState />}

            {error && (
                <ErrorState
                    message="Unable to load employees"
                    description={<>Please check your connection and try again.</>}
                />
            )}

            {employees && filteredEmployees.length > 0 && (
                <Table<StaffEntity>
                    columns={columns}
                    data={filteredEmployees}
                    keyExtractor={(row) => row.ID}
                />
            )}

            {employees && employees.length === 0 && (
                <EmptyState
                    icon="group_off"
                    message="No employees found."
                />
            )}

            {employees && employees.length > 0 && filteredEmployees.length === 0 && (
                <EmptyState
                    icon="search_off"
                    message="No employees match your search."
                />
            )}
        </RootLayout>
    );
}


