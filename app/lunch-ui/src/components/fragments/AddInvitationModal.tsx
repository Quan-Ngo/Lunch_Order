import { useMemo, useState } from 'react';
import { Button } from '@/components/elements/Button';
import { SearchBar } from '@/components/elements/SearchBar';
import { LoadingState } from '@/components/elements/LoadingState';
import { type StaffEntity } from '@/services/api';

interface AddInvitationModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    staff: StaffEntity[];
    invitedStaffIds: string[];
    onAdd: (staff: StaffEntity[]) => void;
}

export function AddInvitationModal({
    isOpen,
    onClose,
    isLoading,
    staff,
    invitedStaffIds,
    onAdd,
}: AddInvitationModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

    const filteredStaff = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return staff.filter((employee) => {
            if (invitedStaffIds.includes(employee.ID)) return false;
            if (!query) return true;
            return (
                employee.name.toLowerCase().includes(query) ||
                (employee.email || '').toLowerCase().includes(query)
            );
        });
    }, [invitedStaffIds, searchTerm, staff]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    const toggleSelection = (staffId: string) => {
        setSelectedStaffIds((prev) =>
            prev.includes(staffId)
                ? prev.filter((id) => id !== staffId)
                : [...prev, staffId]
        );
    };

    const handleAddSelected = () => {
        const selectedStaff = filteredStaff.filter((employee) => selectedStaffIds.includes(employee.ID));
        if (selectedStaff.length === 0) return;
        onAdd(selectedStaff);
        setSelectedStaffIds([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            <div
                className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0"
                onClick={handleBackdropClick}
            >
                <div className="fixed inset-0 bg-black/60 transition-opacity" aria-hidden="true" />

                <div className="relative inline-block w-full sm:max-w-lg sm:my-8 align-middle bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all border border-gray-100">
                    <div className="bg-primary px-6 py-4 flex justify-between items-center">
                        <h3 className="text-xl font-extrabold text-black font-display uppercase tracking-tight">
                            Add invitation
                        </h3>
                        <button onClick={onClose} className="text-black/60 hover:text-black transition-colors" type="button">
                            <span className="material-icons-outlined text-2xl">close</span>
                        </button>
                    </div>

                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search active staff..."
                            className="w-full"
                        />
                    </div>

                    <div className="max-h-[400px] min-h-[300px] overflow-y-auto">
                        {isLoading ? (
                            <div className="py-12">
                                <LoadingState />
                            </div>
                        ) : filteredStaff.length === 0 ? (
                            <div className="px-6 py-12 text-center text-gray-500 font-medium">
                                <span className="material-icons-outlined text-4xl mb-2">group_off</span>
                                <p>No active staff available.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {filteredStaff.map((employee) => (
                                    <li
                                        key={employee.ID}
                                        className={`px-6 py-4 flex items-center justify-between transition-colors cursor-pointer ${
                                            selectedStaffIds.includes(employee.ID) ? 'bg-primary/15' : 'hover:bg-gray-50'
                                        }`}
                                        onClick={() => toggleSelection(employee.ID)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedStaffIds.includes(employee.ID)}
                                                onChange={() => toggleSelection(employee.ID)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="custom-checkbox custom-checkbox-dark-border"
                                            />
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/10">
                                                {employee.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 leading-tight">{employee.name}</p>
                                                <p className="text-sm text-gray-500 font-medium">{employee.email || 'No email'}</p>
                                            </div>
                                        </div>
                                        {selectedStaffIds.includes(employee.ID) && (
                                            <span className="material-icons-outlined text-primary text-xl">check_circle</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <Button variant="secondary" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAddSelected}
                            disabled={selectedStaffIds.length === 0}
                        >
                            {selectedStaffIds.length > 0 ? `Add selected (${selectedStaffIds.length})` : 'Add selected'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
