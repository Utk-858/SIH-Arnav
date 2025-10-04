import jsPDF from 'jspdf';
import type { DietPlan, Patient, Vitals, PatientFeedback } from './types';

// Diet Chart PDF Export
export function exportDietChartToPDF(dietPlan: DietPlan, patientName: string) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('Ayurvedic Diet Plan', 20, 30);

  // Patient and Plan Info
  doc.setFontSize(12);
  doc.text(`Patient: ${patientName}`, 20, 50);
  doc.text(`Plan: ${dietPlan.title}`, 20, 60);
  if (dietPlan.description) {
    doc.text(`Description: ${dietPlan.description}`, 20, 70);
  }

  let yPosition = 90;

  // Diet Days
  dietPlan.dietDays?.forEach((day, dayIndex) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.text(`${day.day || `Day ${dayIndex + 1}`}`, 20, yPosition);
    yPosition += 10;

    // Meals
    day.meals?.forEach((meal) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(12);
      doc.text(`${meal.name || meal.time || 'Meal'}: ${meal.time || ''}`, 30, yPosition);
      yPosition += 8;

      // Items
      meal.items?.forEach((item) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        doc.setFontSize(10);
        doc.text(`• ${item}`, 40, yPosition);
        yPosition += 6;
      });

      // Notes
      if (meal.notes) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        doc.setFontSize(10);
        doc.text(`Notes: ${meal.notes}`, 40, yPosition);
        yPosition += 8;
      }

      yPosition += 4;
    });

    yPosition += 10;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280);
    doc.text(`Page ${i} of ${pageCount}`, 170, 280);
  }

  doc.save(`${patientName}_diet_plan.pdf`);
}

// Patient Progress Report PDF Export
export function exportPatientProgressToPDF(
  patient: Patient,
  vitalsHistory: Vitals[],
  feedbackHistory: PatientFeedback[],
  consultations: any[]
) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('Patient Progress Report', 20, 30);

  // Patient Info
  doc.setFontSize(12);
  doc.text(`Patient: ${patient.name}`, 20, 50);
  doc.text(`Code: ${patient.code}`, 20, 60);
  doc.text(`Age: ${patient.age}, Gender: ${patient.gender}`, 20, 70);

  let yPosition = 90;

  // Progress Metrics
  if (vitalsHistory.length > 1) {
    const latest = vitalsHistory[0];
    const first = vitalsHistory[vitalsHistory.length - 1];
    const weightChange = latest.weight - first.weight;
    const bmiChange = latest.bmi - first.bmi;

    doc.setFontSize(14);
    doc.text('Progress Metrics', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.text(`Weight Change: ${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`, 30, yPosition);
    yPosition += 8;
    doc.text(`BMI Change: ${bmiChange > 0 ? '+' : ''}${bmiChange.toFixed(1)}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Total Consultations: ${consultations.length}`, 30, yPosition);
    yPosition += 8;
    doc.text(`Feedback Entries: ${feedbackHistory.length}`, 30, yPosition);
    yPosition += 20;
  }

  // Vitals History
  if (vitalsHistory.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.text('Vitals History', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    vitalsHistory.slice(0, 10).forEach((vitals) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      const date = vitals.date instanceof Date ? vitals.date.toLocaleDateString() :
                   (vitals.date && typeof vitals.date === 'object' && 'toDate' in vitals.date) ?
                   (vitals.date as any).toDate().toLocaleDateString() : 'Unknown';

      doc.text(`${date}: BP ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}, Weight ${vitals.weight}kg, BMI ${vitals.bmi}`, 30, yPosition);
      yPosition += 8;
    });
    yPosition += 10;
  }

  // Feedback Summary
  if (feedbackHistory.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.text('Patient Feedback', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    feedbackHistory.slice(0, 5).forEach((feedback) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      const date = feedback.date instanceof Date ? feedback.date.toLocaleDateString() :
                   (feedback.date && typeof feedback.date === 'object' && 'toDate' in feedback.date) ?
                   (feedback.date as any).toDate().toLocaleDateString() : 'Unknown';

      doc.text(`${date}: Energy ${feedback.energyLevel}/5, Digestion: ${feedback.digestion}`, 30, yPosition);
      yPosition += 8;
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280);
    doc.text(`Page ${i} of ${pageCount}`, 170, 280);
  }

  doc.save(`${patient.name}_progress_report.pdf`);
}

// Consultation Summary PDF Export
export function exportConsultationSummaryToPDF(consultation: any, patient: Patient) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('Consultation Summary', 20, 30);

  // Patient and Consultation Info
  doc.setFontSize(12);
  doc.text(`Patient: ${patient.name} (${patient.code})`, 20, 50);
  doc.text(`Consultation ID: ${consultation.id.slice(-6)}`, 20, 60);

  const date = consultation.date && typeof consultation.date === 'object' && 'toDate' in consultation.date ?
               consultation.date.toDate().toLocaleDateString() : 'Unknown';
  doc.text(`Date: ${date}`, 20, 70);
  doc.text(`Status: ${consultation.status}`, 20, 80);

  let yPosition = 100;

  // Notes
  if (consultation.notes) {
    doc.setFontSize(14);
    doc.text('Consultation Notes', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const lines = doc.splitTextToSize(consultation.notes, 170);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * 5 + 10;
  }

  // Recommendations
  if (consultation.recommendations) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.text('Recommendations', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    const lines = doc.splitTextToSize(consultation.recommendations, 170);
    doc.text(lines, 20, yPosition);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280);
    doc.text(`Page ${i} of ${pageCount}`, 170, 280);
  }

  doc.save(`${patient.name}_consultation_${consultation.id.slice(-6)}.pdf`);
}

// Hospital Records PDF Export
export function exportHospitalRecordsToPDF(patient: Patient, vitalsHistory: Vitals[], consultations: any[]) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.text('Hospital Records', 20, 30);

  // Patient Info
  doc.setFontSize(12);
  doc.text(`Patient: ${patient.name}`, 20, 50);
  doc.text(`Code: ${patient.code}`, 20, 60);
  doc.text(`Age: ${patient.age}, Gender: ${patient.gender}`, 20, 70);

  if (patient.doshaType) {
    doc.text(`Dosha Type: ${patient.doshaType}`, 20, 80);
  }

  if (patient.allergies?.length) {
    doc.text(`Allergies: ${patient.allergies.join(', ')}`, 20, 90);
  }

  let yPosition = 110;

  // Vitals History
  if (vitalsHistory.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.text('Vitals History', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    vitalsHistory.forEach((vitals) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      const date = vitals.date instanceof Date ? vitals.date.toLocaleDateString() :
                   (vitals.date && typeof vitals.date === 'object' && 'toDate' in vitals.date) ?
                   (vitals.date as any).toDate().toLocaleDateString() : 'Unknown';

      doc.text(`${date}:`, 30, yPosition);
      yPosition += 6;
      doc.text(`  BP: ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg`, 40, yPosition);
      yPosition += 6;
      doc.text(`  Weight: ${vitals.weight} kg, Height: ${vitals.height} cm, BMI: ${vitals.bmi}`, 40, yPosition);
      yPosition += 6;
      if (vitals.temperature) doc.text(`  Temperature: ${vitals.temperature}°C`, 40, yPosition);
      if (vitals.pulse) doc.text(`  Pulse: ${vitals.pulse} bpm`, 40, yPosition);
      yPosition += 8;
    });
    yPosition += 10;
  }

  // Consultations
  if (consultations.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    doc.setFontSize(14);
    doc.text('Consultation History', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    consultations.forEach((consultation) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      const date = consultation.date && typeof consultation.date === 'object' && 'toDate' in consultation.date ?
                   consultation.date.toDate().toLocaleDateString() : 'Unknown';

      doc.text(`${date} - ${consultation.status}:`, 30, yPosition);
      yPosition += 6;

      if (consultation.notes) {
        const lines = doc.splitTextToSize(consultation.notes.substring(0, 200) + '...', 160);
        doc.text(lines, 40, yPosition);
        yPosition += lines.length * 5 + 5;
      }
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280);
    doc.text(`Page ${i} of ${pageCount}`, 170, 280);
  }

  doc.save(`${patient.name}_hospital_records.pdf`);
}