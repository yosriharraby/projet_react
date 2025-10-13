pnpm installndpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints
- `POST /api/register` - User registration

### Patients
- `GET /api/patients` - List patients (with search/pagination)
- `POST /api/patients` - Create new patient
- `GET /api/patients/[id]` - Get patient details
- `PUT /api/patients/[id]` - Update patient
- `DELETE /api/patients/[id]` - Delete patient

### Services
- `GET /api/services` - List services (with filtering)
- `POST /api/services` - Create new service
- `PUT /api/services/[id]` - Update service
- `DELETE /api/services/[id]` - Delete service

### Appointments
- `GET /api/appointments` - List appointments (with date filtering)
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Delete appointment

## 🗄️ Database Schema

### Core Models
- **User** - System users with authentication
- **Clinic** - Medical clinics (multi-tenant)
- **Membership** - User-clinic relationships with roles

### Medical Models
- **Patient** - Patient records with medical information
- **Service** - Clinic services with pricing
- **Appointment** - Scheduled appointments with status tracking
- **MedicalRecord** - Patient medical history

### Auth Models (NextAuth)
- **Account** - OAuth account information
- **Session** - User sessions
- **VerificationToken** - Email verification tokens

## 🔒 Security Features

- **Password Hashing** - bcryptjs for secure password storage
- **Route Protection** - Middleware-based authentication
- **Multi-tenant Isolation** - Clinic data separation
- **Input Validation** - Zod schema validation
- **CSRF Protection** - Built-in NextAuth protection

## 🚀 Deployment

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build and deploy the application

### Recommended Platforms
- **Vercel** - Seamless Next.js deployment
- **Railway** - Full-stack deployment with PostgreSQL
- **DigitalOcean** - VPS deployment option

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database management with [Prisma](https://prisma.io/)
- Authentication with [NextAuth.js](https://next-auth.js.org/)

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation above

---

**MedFlow** - Streamlining medical clinic management with modern technology. 🏥✨
