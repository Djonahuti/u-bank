'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    nin: '',
    email: '',
    password: '',
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      await supabase.from('customers').insert({
        user_id: data.user?.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        date_of_birth: formData.dateOfBirth,
        nin: formData.nin,
        email: formData.email,
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Sign up error:', error);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Address"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={e => setFormData({ ...formData, city: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={e => setFormData({ ...formData, state: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Zip Code"
            value={formData.zipCode}
            onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="date"
            placeholder="Date of Birth"
            value={formData.dateOfBirth}
            onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="National ID Number"
            value={formData.nin}
            onChange={e => setFormData({ ...formData, nin: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <Button type="submit">Sign Up</Button>
        </form>
      </CardContent>
    </Card>
  );
}