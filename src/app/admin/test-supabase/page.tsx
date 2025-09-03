'use client'

import { createSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

export default function TestSupabasePage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runTests = async () => {
    setIsLoading(true)
    setTestResults([])
    
    try {
      const supabase = createSupabaseClient()
      
      // Test 1: Authentication
      addResult('Testing authentication...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        addResult(`Authentication failed: ${authError?.message || 'No user'}`)
        return
      }
      addResult(`User authenticated: ${user.id}`)
      
      // Test 2: Profile access
      addResult('Testing profile access...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        addResult(`Profile access failed: ${profileError.message}`)
        return
      }
      addResult(`Profile accessed: ${JSON.stringify(profile)}`)
      
      // Test 3: Tasks read access
      addResult('Testing tasks read access...')
      const { data: tasks, error: tasksReadError } = await supabase
        .from('tasks')
        .select('*')
        .limit(5)
      
      if (tasksReadError) {
        addResult(`Tasks read failed: ${tasksReadError.message}`)
        return
      }
      addResult(`Tasks read successful: ${tasks?.length || 0} tasks found`)
      
      // Test 4: Tasks insert access
      addResult('Testing tasks insert access...')
      const testTask = {
        title: 'Test Task for Permissions',
        description: 'Testing if we can insert tasks',
        domain: 'Technical',
        subdomain: 'Web Development: Frontend',
        target_year: 1,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      const { data: insertedTask, error: insertError } = await supabase
        .from('tasks')
        .insert(testTask)
        .select()
        .single()
      
      if (insertError) {
        addResult(`Tasks insert failed: ${insertError.message}`)
        return
      }
      addResult(`Tasks insert successful: ${insertedTask.id}`)
      
      // Test 5: Tasks update access
      addResult('Testing tasks update access...')
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ title: 'Updated Test Task' })
        .eq('id', insertedTask.id)
      
      if (updateError) {
        addResult(`Tasks update failed: ${updateError.message}`)
        return
      }
      addResult('Tasks update successful')
      
      // Test 6: Tasks delete access
      addResult('Testing tasks delete access...')
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', insertedTask.id)
      
      if (deleteError) {
        addResult(`Tasks delete failed: ${deleteError.message}`)
        return
      }
      addResult('Tasks delete successful')
      
      addResult('All tests passed! Supabase permissions are working correctly.')
      
    } catch (error) {
      addResult(`Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Supabase Connection Test</h1>
        <p className="text-lg text-gray-600 mt-2">
          Test your Supabase connection and permissions
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click &quot;Run All Tests&quot; to start.</p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {result}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
