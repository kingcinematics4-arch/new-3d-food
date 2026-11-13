import type { Metadata } from 'next';
import LegalPage from '@/components/site/LegalPage';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Terms and Conditions — DinePixel',
    description:
      'The terms that govern your use of the DinePixel website, restaurant menu platform and related services.',
    alternates: {
      canonical: '/terms',
    },
    openGraph: {
      title: 'Terms and Conditions — DinePixel',
      description:
        'The terms that govern your use of the DinePixel website, restaurant menu platform and related services.',
      type: 'website',
      url: '/terms',
    },
  };
}

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Terms and Conditions"
      intro="These Terms and Conditions govern your use of the DinePixel website, restaurant menu pages and related services. By using the service, you agree to these terms."
      updated="13 November 2026"
      sections={[
        {
          heading: '1. Acceptance of terms',
          body: [
            'By accessing or using DinePixel, you confirm that you can form a binding contract and agree to these Terms. If you do not agree, do not use the service.',
          ],
        },
        {
          heading: '2. The service',
          body: [
            'DinePixel provides tools for restaurants to publish digital menus, present dishes in 3D, manage orders and view analytics. We may add, change or remove features over time.',
          ],
        },
        {
          heading: '3. Accounts and eligibility',
          body: [
            'You are responsible for the accuracy of the information you provide and for keeping your account credentials secure. You must be authorised to use the email address and restaurant details associated with your account.',
          ],
        },
        {
          heading: '4. Restaurant responsibilities',
          body: [
            'Restaurants are responsible for their menu content, prices, availability, descriptions, images, 3D models, allergens and other information. Content must be accurate and must not infringe the rights of others or violate applicable law.',
            'Restaurants are also responsible for complying with food safety, consumer protection, privacy and other laws that apply to their business.',
          ],
        },
        {
          heading: '5. Orders and payments',
          body: [
            'Customer orders placed through a restaurant menu are received by that restaurant. The restaurant is responsible for accepting, preparing and fulfilling orders and for any payments, refunds or disputes.',
            'DinePixel may provide order-management and payment-status features, but it does not guarantee order acceptance or food quality.',
          ],
        },
        {
          heading: '6. Acceptable use',
          body: [
            'You must not misuse the service, attempt to gain unauthorised access, interfere with its operation, upload malicious code, scrape data in a way that burdens the platform, or use the service to violate the rights of others.',
          ],
        },
        {
          heading: '7. Intellectual property',
          body: [
            'The DinePixel name, logo, website design, software and underlying technology are owned by DinePixel or its licensors. Restaurant content remains the property of the restaurant or its licensors, subject to the rights granted to operate the service.',
          ],
        },
        {
          heading: '8. Third-party services',
          body: [
            'The service may rely on third-party hosting, database, analytics, messaging or payment providers. We are not responsible for third-party services that are outside our reasonable control.',
          ],
        },
        {
          heading: '9. Disclaimers',
          body: [
            'The service is provided on an “as is” and “as available” basis. To the extent permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose and non-infringement.',
          ],
        },
        {
          heading: '10. Limitation of liability',
          body: [
            'To the extent permitted by law, DinePixel is not liable for indirect, incidental, special, consequential or punitive damages, or for loss of profits, revenue, data or goodwill arising from your use of the service.',
          ],
        },
        {
          heading: '11. Termination',
          body: [
            'We may suspend or terminate access to the service if you breach these Terms or if required by law. You may stop using the service at any time. Some provisions survive termination.',
          ],
        },
        {
          heading: '12. Governing law',
          body: [
            'These Terms are governed by the laws applicable in the jurisdiction where DinePixel operates, without regard to conflict-of-law principles. Any dispute will be handled in the courts of that jurisdiction, unless applicable law provides otherwise.',
          ],
        },
        {
          heading: '13. Changes to these terms',
          body: [
            'We may update these Terms from time to time. The “Last updated” date above reflects the latest revision. Continued use of the service after an update means you accept the revised terms.',
          ],
        },
        {
          heading: '14. Contact',
          body: ['If you have questions about these Terms, contact us at hello@dinepixel.com.'],
        },
      ]}
    />
  );
}