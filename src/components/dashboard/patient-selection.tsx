"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, User, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { patientsService } from "@/lib/firestore";
import { useAuthContext } from "@/lib/auth-context";
import type { Patient } from "@/lib/types";

interface PatientSelectionProps {
  onPatientSelect: (patient: Patient) => void;
  selectedPatientId?: string;
}

export function PatientSelection({ onPatientSelect, selectedPatientId }: PatientSelectionProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { userProfile } = useAuthContext();

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, selectedHospital]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const allPatients = await patientsService.getAll();
      setPatients(allPatients);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by hospital if user has hospital context
    if (selectedHospital !== "all" && userProfile?.hospitalId) {
      filtered = filtered.filter(patient => patient.hospitalId === selectedHospital);
    }

    setFilteredPatients(filtered);
  };

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect(patient);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading patients...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Patient
          </CardTitle>
          <CardDescription>
            Choose your patient record to access your personalized health dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {userProfile?.hospitalId && (
              <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by hospital" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hospitals</SelectItem>
                  <SelectItem value={userProfile.hospitalId}>My Hospital</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Patient List */}
          <div className="grid gap-3 max-h-96 overflow-y-auto">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No patients found matching your search.</p>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedPatientId === patient.id ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handlePatientSelect(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{patient.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Code: {patient.code} • Age: {patient.age} • {patient.gender}
                        </p>
                        {patient.hospitalId && (
                          <p className="text-xs text-muted-foreground">
                            Hospital ID: {patient.hospitalId}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {patient.dietitianId && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Assigned
                        </Badge>
                      )}
                      {selectedPatientId === patient.id && (
                        <Badge variant="default" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create New Patient Option */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New Patient Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Patient Record</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will create a new patient record. Please ensure you have the necessary permissions.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // TODO: Implement patient creation form
                      setShowCreateDialog(false);
                    }}
                    className="flex-1"
                  >
                    Create Patient
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}