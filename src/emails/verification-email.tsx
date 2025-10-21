import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
}

export default function VerificationEmail({
  userName,
  verificationUrl,
}: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>ยืนยันอีเมลของคุณสำหรับ ProjectFlow</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>ยินดีต้อนรับสู่ ProjectFlow</Heading>
          <Text style={text}>สวัสดี {userName},</Text>
          <Text style={text}>
            ขอบคุณที่ลงทะเบียนใช้งาน ProjectFlow
            กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              ยืนยันอีเมล
            </Button>
          </Section>
          <Text style={text}>
            หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:
          </Text>
          <Text style={link}>{verificationUrl}</Text>
          <Text style={footer}>
            ลิงก์นี้จะหมดอายุภายใน 24 ชั่วโมง
          </Text>
          <Text style={footer}>
            หากคุณไม่ได้ลงทะเบียนบัญชีนี้ กรุณาเพิกเฉยอีเมลนี้
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  margin: '16px 40px',
};

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px 0',
  margin: '0 auto',
};

const link = {
  color: '#2563eb',
  fontSize: '14px',
  textDecoration: 'underline',
  margin: '16px 40px',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '16px 40px',
};
