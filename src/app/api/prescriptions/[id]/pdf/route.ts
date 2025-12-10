import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership } from "@/lib/role-check";
import { jsPDF } from "jspdf";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic } = authResult;

    const prescription = await prisma.prescription.findFirst({
      where: {
        id: params.id,
        clinicId: clinic.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dateOfBirth: true,
            phone: true,
            address: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    // Générer le PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // En-tête
    doc.setFontSize(20);
    doc.setFont(undefined, "bold");
    doc.text("ORDONNANCE MÉDICALE", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Informations de la clinique
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text(prescription.clinic.name, margin, yPosition);
    yPosition += 7;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    if (prescription.clinic.address) {
      doc.text(`Adresse: ${prescription.clinic.address}`, margin, yPosition);
      yPosition += 5;
    }
    if (prescription.clinic.phone) {
      doc.text(`Téléphone: ${prescription.clinic.phone}`, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 5;

    // Informations du patient
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("INFORMATIONS PATIENT", margin, yPosition);
    yPosition += 7;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    doc.text(
      `Nom: ${prescription.patient.firstName} ${prescription.patient.lastName}`,
      margin,
      yPosition
    );
    yPosition += 5;
    if (prescription.patient.dateOfBirth) {
      const birthDate = new Date(prescription.patient.dateOfBirth);
      doc.text(
        `Date de naissance: ${birthDate.toLocaleDateString("fr-FR")}`,
        margin,
        yPosition
      );
      yPosition += 5;
    }
    if (prescription.patient.address) {
      doc.text(`Adresse: ${prescription.patient.address}`, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 5;

    // Date de prescription et médecin
    doc.setFontSize(10);
    doc.text(
      `Date de prescription: ${new Date(prescription.createdAt).toLocaleDateString("fr-FR")}`,
      margin,
      yPosition
    );
    yPosition += 5;
    if (prescription.createdBy.name) {
      doc.text(`Prescrit par: Dr. ${prescription.createdBy.name}`, margin, yPosition);
      yPosition += 5;
    }
    yPosition += 10;

    // Diagnostic
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("DIAGNOSTIC", margin, yPosition);
    yPosition += 7;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    const diagnosisLines = doc.splitTextToSize(prescription.diagnosis, pageWidth - 2 * margin);
    doc.text(diagnosisLines, margin, yPosition);
    yPosition += diagnosisLines.length * 5 + 5;

    // Médicaments
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("MÉDICAMENTS PRESCRITS", margin, yPosition);
    yPosition += 7;
    doc.setFont(undefined, "normal");
    doc.setFontSize(10);
    const medicationLines = doc.splitTextToSize(prescription.medications, pageWidth - 2 * margin);
    doc.text(medicationLines, margin, yPosition);
    yPosition += medicationLines.length * 5 + 5;

    // Instructions
    if (prescription.instructions) {
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("INSTRUCTIONS", margin, yPosition);
      yPosition += 7;
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      const instructionLines = doc.splitTextToSize(prescription.instructions, pageWidth - 2 * margin);
      doc.text(instructionLines, margin, yPosition);
      yPosition += instructionLines.length * 5 + 5;
    }

    // Notes (si présentes)
    if (prescription.notes) {
      yPosition += 5;
      doc.setFontSize(9);
      doc.setFont(undefined, "italic");
      doc.setTextColor(100, 100, 100);
      const notesLines = doc.splitTextToSize(`Note: ${prescription.notes}`, pageWidth - 2 * margin);
      doc.text(notesLines, margin, yPosition);
      doc.setTextColor(0, 0, 0);
    }

    // Pied de page
    yPosition = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Ordonnance n°${prescription.id.slice(-8).toUpperCase()} • Généré le ${new Date().toLocaleDateString("fr-FR")}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    // Convertir en buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ordonnance_${prescription.patient.lastName}_${new Date(prescription.createdAt).toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

