import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenLine, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { travelPlanService } from '../services/travelPlanService';

export const CreateTravelPlan = () => {
  const navigate = useNavigate();
  const [formErr, setFormErr] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [tripData, setTripData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: 0,
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTripData(prev => ({
      ...prev,
      [name]: name === 'budget' ? Number(value) : value
    }));
  };

  const checkValidation = () => {
    if (!tripData.name || !tripData.startDate || !tripData.endDate) {
      return "Please fill in all required fields (Name, Start Date, End Date).";
    }
    if (new Date(tripData.endDate) < new Date(tripData.startDate)) {
      return "End date cannot be before start date.";
    }
    if (tripData.budget < 0) {
      return "Budget cannot be negative.";
    }
    return null;
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);

    const validationMsg = checkValidation();
    if (validationMsg) {
      setFormErr(validationMsg);
      return;
    }

    setIsSubmitting(true);
    try {
      const createdPlan = await travelPlanService.create(tripData);
      navigate(`/travel-plans/${createdPlan.id}`);
    } catch (err: any) {
      setFormErr(err.response?.data?.message || 'Failed to create the plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal/15 border border-teal/30 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-snow">New Travel Plan</h1>
          <p className="font-functional text-sm text-slate mt-0.5">Fill in the details for your upcoming trip.</p>
        </div>
      </div>

      <form onSubmit={submitForm} className="bg-navy-light border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
        {formErr && (
          <div className="mb-5 p-3 bg-danger/10 border border-danger/30 text-danger text-sm font-functional text-center rounded-xl">
            {formErr}
          </div>
        )}

        <div className="space-y-5">
          <Input
            label="Plan Name *"
            name="name"
            value={tripData.name}
            onChange={handleInputChange}
            placeholder="e.g., Summer Europe Trip"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Start Date *"
              name="startDate"
              type="date"
              value={tripData.startDate}
              onChange={handleInputChange}
              required
            />
            <Input
              label="End Date *"
              name="endDate"
              type="date"
              value={tripData.endDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <Input
            label="Budget"
            name="budget"
            type="number"
            min="0"
            step="0.01"
            value={tripData.budget}
            onChange={handleInputChange}
          />

          <Input
            label="Description"
            name="description"
            isTextArea
            value={tripData.description}
            onChange={handleInputChange}
            placeholder="What's this trip about?"
          />

          <Input
            label="Notes (Private)"
            name="notes"
            isTextArea
            value={tripData.notes}
            onChange={handleInputChange}
            placeholder="Reminders, things to remember..."
          />
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border">
          <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <PenLine className="w-4 h-4" />
            Create Plan
          </Button>
        </div>
      </form>
    </div>
  );
};