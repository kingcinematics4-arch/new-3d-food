import type { Metadata } from 'next';
import LegalPage from '@/components/site/LegalPage';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Privacy Policy — DinePixel',
    description:
      'How DinePixel collects, uses, shares and protects information when you use our website and restaurant menu platform.',
    alternates: {
      canonical: '/privacy',
    },
    openGraph: {
      title: 'Privacy Policy — DinePixel',
      description:
        'How DinePixel collects, uses, shares and protects information when you use our website and restaurant menu platform.',
      type: 'website',
      url: '/privacy',
    },
  };
}

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Privacy Policy"
      intro="This Privacy Policy explains how DinePixel collects, uses and protects information when you use our website, restaurant menu pages and related services."
      updated="13 November 2026"
      sections={[
        {
          heading: '1. Information we collect',
          body: [
            'We collect information you provide directly, such as your name, email address, phone number, restaurant details and the content you upload to your menu.',
            'We also collect information generated when you use the service, such as device and browser information, pages viewed, menu interactions and order activity processed on behalf of a restaurant.',
          ],
        },
        {
          heading: '2. How we use information',
          body: [
            'We use information to provide and operate the DinePixel platform, publish restaurant menus, process customer orders, send service and account communications, monitor performance, prevent abuse and comply with legal obligations.',
            'We do not sell personal information.',
          ],
        },
        {
          heading: '3. Restaurant and guest data',
          body: [
            'Restaurants control their own menu content, pricing and customer order data. DinePixel processes this information on behalf of the restaurant to provide the service.',
            'If you are a guest placing an order, the restaurant is responsible for the order and for handling any request about that order.',
          ],
        },
        {
          heading: '4. Cookies and analytics',
          body: [
            'We use essential cookies and similar technologies to keep the service secure and working correctly. We may use analytics to understand how the platform is used and to improve it.',
            'You can control cookies through your browser settings, but disabling essential cookies may affect how the service works.',
          ],
        },
        {
          heading: '5. How we share information',
          body: [
            'We share information with service providers that help us host the platform, store data, send communications and operate the service. These providers are required to protect the information.',
            'We may disclose information if required by law, to protect the rights and safety of our users or the public, or in connection with a merger, acquisition or sale of assets.',
          ],
        },
        {
          heading: '6. Data retention',
          body: [
            'We retain information for as long as needed to provide the service, comply with legal obligations, resolve disputes and enforce our agreements. Restaurant content and order records may be retained according to the restaurant’s settings and applicable law.',
          ],
        },
        {
          heading: '7. Your privacy rights',
          body: [
            'Depending on where you live, you may have the right to access, correct, delete or restrict the use of your personal information, or to object to certain processing.',
            'To make a request, contact us using the details below. We may need to verify your identity before acting on a request.',
          ],
        },
        {
          heading: '8. Security',
          body: [
            'We use administrative, technical and organisational safeguards designed to protect information. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
          ],
        },
        {
          heading: '9. Children’s privacy',
          body: [
            'The DinePixel platform is intended for restaurants and their guests. It is not directed to children, and we do not knowingly collect personal information from children through the platform.',
          ],
        },
        {
          heading: '10. Changes to this policy',
          body: [
            'We may update this Privacy Policy from time to time. The “Last updated” date above reflects the latest revision. Continued use of the service after an update means you accept the revised policy.',
          ],
        },
        {
          heading: '11. Contact',
          body: [
            'If you have questions about this Privacy Policy or a privacy request, contact us at hello@dinepixel.com.',
          ],
        },
      ]}
    />
  );
}