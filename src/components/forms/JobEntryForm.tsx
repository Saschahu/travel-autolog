import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, User, Wrench, Hotel, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface JobData {
  travelStart: string;
  travelEnd: string;
  workStart: string;
  workEnd: string;
  departureStart: string;
  departureEnd: string;
  customerName: string;
  customerAddress: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  workPerformed: string;
  hotelName: string;
  hotelAddress: string;
  hotelNights: number;
  kilometersOutbound: number;
  kilometersReturn: number;
  tollAmount: number;
}

export const JobEntryForm = () => {
  const [jobData, setJobData] = useState<Partial<JobData>>({});
  const [currentStep, setCurrentStep] = useState<'times' | 'customer' | 'machine' | 'travel'>('times');

  const updateField = (field: keyof JobData, value: string | number) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentTime = () => {
    return new Date().toTimeString().slice(0, 5);
  };

  const renderTimeSection = () => (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Arbeitszeiten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="travel-start" className="text-sm font-medium">Anreise Start</Label>
            <Input
              id="travel-start"
              type="time"
              value={jobData.travelStart || ''}
              onChange={(e) => updateField('travelStart', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="travel-end" className="text-sm font-medium">Anreise Ende</Label>
            <Input
              id="travel-end"
              type="time"
              value={jobData.travelEnd || ''}
              onChange={(e) => updateField('travelEnd', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="work-start" className="text-sm font-medium">Arbeit Start</Label>
            <Input
              id="work-start"
              type="time"
              value={jobData.workStart || ''}
              onChange={(e) => updateField('workStart', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="work-end" className="text-sm font-medium">Arbeit Ende</Label>
            <Input
              id="work-end"
              type="time"
              value={jobData.workEnd || ''}
              onChange={(e) => updateField('workEnd', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => updateField('workStart', getCurrentTime())}
          className="w-full"
        >
          Jetzt als Arbeitsbeginn markieren
        </Button>
      </CardContent>
    </Card>
  );

  const renderCustomerSection = () => (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          Kundendaten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="customer-name" className="text-sm font-medium">
            Kundenname <Badge variant="destructive" className="ml-1 text-xs">Pflicht</Badge>
          </Label>
          <Input
            id="customer-name"
            placeholder="Firmenname oder Privatperson"
            value={jobData.customerName || ''}
            onChange={(e) => updateField('customerName', e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="customer-address" className="text-sm font-medium">Kundenadresse</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="customer-address"
              placeholder="Automatisch über Maps API"
              value={jobData.customerAddress || ''}
              onChange={(e) => updateField('customerAddress', e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMachineSection = () => (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5 text-primary" />
          Maschinendaten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor="manufacturer" className="text-sm font-medium">Hersteller</Label>
            <Input
              id="manufacturer"
              placeholder="z.B. Siemens, ABB, Schneider"
              value={jobData.manufacturer || ''}
              onChange={(e) => updateField('manufacturer', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="model" className="text-sm font-medium">Modell</Label>
            <Input
              id="model"
              placeholder="Modellbezeichnung"
              value={jobData.model || ''}
              onChange={(e) => updateField('model', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="serial" className="text-sm font-medium">Seriennummer</Label>
            <Input
              id="serial"
              placeholder="Seriennummer"
              value={jobData.serialNumber || ''}
              onChange={(e) => updateField('serialNumber', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="work-performed" className="text-sm font-medium">Durchgeführte Arbeiten</Label>
          <Textarea
            id="work-performed"
            placeholder="Beschreibung der durchgeführten Arbeiten..."
            value={jobData.workPerformed || ''}
            onChange={(e) => updateField('workPerformed', e.target.value)}
            className="mt-1 min-h-20"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderTravelSection = () => (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5 text-primary" />
          Reise & Unterkunft
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="departure-start" className="text-sm font-medium">Abfahrt Start</Label>
            <Input
              id="departure-start"
              type="time"
              value={jobData.departureStart || ''}
              onChange={(e) => updateField('departureStart', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="departure-end" className="text-sm font-medium">Abfahrt Ende</Label>
            <Input
              id="departure-end"
              type="time"
              value={jobData.departureEnd || ''}
              onChange={(e) => updateField('departureEnd', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="hotel-name" className="text-sm font-medium">
              <Hotel className="h-4 w-4 inline mr-1" />
              Hotel Name (optional)
            </Label>
            <Input
              id="hotel-name"
              placeholder="Hotel Name"
              value={jobData.hotelName || ''}
              onChange={(e) => updateField('hotelName', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="hotel-address" className="text-sm font-medium">Hotel Adresse</Label>
            <Input
              id="hotel-address"
              placeholder="Automatisch über Maps API"
              value={jobData.hotelAddress || ''}
              onChange={(e) => updateField('hotelAddress', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="hotel-nights" className="text-sm font-medium">Anzahl Nächte</Label>
            <Input
              id="hotel-nights"
              type="number"
              min="0"
              placeholder="0"
              value={jobData.hotelNights || ''}
              onChange={(e) => updateField('hotelNights', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="km-outbound" className="text-sm font-medium">KM Hinfahrt</Label>
            <Input
              id="km-outbound"
              type="number"
              min="0"
              placeholder="0"
              value={jobData.kilometersOutbound || ''}
              onChange={(e) => updateField('kilometersOutbound', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="km-return" className="text-sm font-medium">KM Rückfahrt</Label>
            <Input
              id="km-return"
              type="number"
              min="0"
              placeholder="0"
              value={jobData.kilometersReturn || ''}
              onChange={(e) => updateField('kilometersReturn', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="toll-amount" className="text-sm font-medium">Maut (NOK)</Label>
          <Input
            id="toll-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={jobData.tollAmount || ''}
            onChange={(e) => updateField('tollAmount', parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );

  const steps = [
    { id: 'times', label: 'Zeiten', icon: Clock },
    { id: 'customer', label: 'Kunde', icon: User },
    { id: 'machine', label: 'Maschine', icon: Wrench },
    { id: 'travel', label: 'Reise', icon: Car },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Step Navigation */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          
          return (
            <Button
              key={step.id}
              variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
              size="sm"
              onClick={() => setCurrentStep(step.id as any)}
              className="flex-1 mx-1"
            >
              <Icon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{step.label}</span>
            </Button>
          );
        })}
      </div>

      <Separator />

      {/* Current Step Content */}
      {currentStep === 'times' && renderTimeSection()}
      {currentStep === 'customer' && renderCustomerSection()}
      {currentStep === 'machine' && renderMachineSection()}
      {currentStep === 'travel' && renderTravelSection()}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1].id as any);
            }
          }}
          disabled={currentStep === 'times'}
        >
          Zurück
        </Button>
        
        <Button
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            if (currentIndex < steps.length - 1) {
              setCurrentStep(steps[currentIndex + 1].id as any);
            } else if (currentStep === 'travel') {
              // Save job data
              console.log('Saving job data:', jobData);
              alert('Job erfolgreich gespeichert! (Funktionalität wird noch implementiert)');
            }
          }}
        >
          {currentStep === 'travel' ? 'Job Speichern' : 'Weiter'}
        </Button>
      </div>
    </div>
  );
};