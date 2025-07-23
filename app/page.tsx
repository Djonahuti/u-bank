import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle>Welcome to U-Bank</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/auth/sign-in">
            <Button className="w-full">Sign In</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button className="w-full" variant="outline">Sign Up</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}