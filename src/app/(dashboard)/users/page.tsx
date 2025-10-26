/**
 * Users Management Page
 * Route: /users
 *
 * Access: Admin, Chief, Leader, Head only
 * Features: List, search, filter, create, edit, delete users
 */

import { Metadata } from 'next';
import { UsersView } from '@/components/users/users-view';

export const metadata: Metadata = {
  title: 'บุคลากร | ProjectFlows',
  description: 'จัดการข้อมูลผู้ใช้งานในระบบ',
};

export default function UsersPage() {
  return <UsersView />;
}
