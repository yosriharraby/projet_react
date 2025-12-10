/**
 * Script de diagnostic pour vérifier les memberships ADMIN
 * Usage: node scripts/check-admin-membership.js <email>
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminMembership(email) {
  try {
    console.log(`\n🔍 Vérification de la membership pour: ${email}\n`);

    // 1. Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            clinic: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log(`✅ Utilisateur trouvé: ${user.name || 'Sans nom'} (${user.email})`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - defaultRole: ${user.defaultRole || 'Non défini'}`);
    console.log(`   - Nombre de memberships: ${user.memberships.length}\n`);

    if (user.memberships.length === 0) {
      console.log('❌ PROBLÈME: Aucune membership trouvée!');
      console.log('   → L\'utilisateur doit avoir une membership ADMIN pour accéder à /admin/staff');
      console.log('   → Solution: Recréer le compte en tant qu\'ADMIN ou créer une membership manuellement\n');
      return;
    }

    // 2. Vérifier les memberships
    let hasAdminMembership = false;
    for (const membership of user.memberships) {
      console.log(`📋 Membership #${membership.id}:`);
      console.log(`   - Rôle: ${membership.role}`);
      console.log(`   - Clinique: ${membership.clinic.name} (ID: ${membership.clinic.id})`);
      console.log(`   - Propriétaire: ${membership.clinic.ownerId === user.id ? 'Oui' : 'Non'}`);
      
      if (membership.role === 'ADMIN') {
        hasAdminMembership = true;
        console.log(`   ✅ C'est une membership ADMIN`);
      }
      console.log('');
    }

    if (!hasAdminMembership) {
      console.log('❌ PROBLÈME: Aucune membership ADMIN trouvée!');
      console.log('   → L\'utilisateur doit avoir une membership avec role="ADMIN"');
      console.log('   → Solution: Créer une membership ADMIN pour cet utilisateur\n');
      return;
    }

    // 3. Vérifier le staff de la clinique
    const adminMembership = user.memberships.find(m => m.role === 'ADMIN');
    if (adminMembership) {
      const staff = await prisma.membership.findMany({
        where: {
          clinicId: adminMembership.clinicId,
          role: {
            in: ['DOCTOR', 'RECEPTIONIST'],
          },
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      console.log(`👥 Staff de la clinique "${adminMembership.clinic.name}":`);
      console.log(`   - Nombre de membres: ${staff.length}`);
      if (staff.length > 0) {
        staff.forEach((member, index) => {
          console.log(`   ${index + 1}. ${member.user.name || 'Sans nom'} (${member.user.email}) - ${member.role}`);
        });
      } else {
        console.log('   (Aucun membre du staff pour le moment)');
      }
      console.log('');
    }

    console.log('✅ Tout semble correct! L\'utilisateur devrait pouvoir accéder à /admin/staff\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'email depuis les arguments
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/check-admin-membership.js <email>');
  console.log('Exemple: node scripts/check-admin-membership.js admin@example.com');
  process.exit(1);
}

checkAdminMembership(email);

