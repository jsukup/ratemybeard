// Direct approach without using supabase-js library
Deno.serve(async (req) => {
  try {
    console.log('Function invoked')
    
    // Get the request body
    const payload = await req.json()
    
    // For DELETE operations, the record data is in old_record, not record
    const recordData = payload.type === 'DELETE' ? payload.old_record : payload.record
    
    if (!recordData) {
      console.error('No record data found in payload')
      return new Response(JSON.stringify({ 
        message: 'No record data found in payload',
        payload: payload
      }), { status: 400 })
    }

    if (!recordData.image_name) {
      console.error('No image_name found in record')
      return new Response(JSON.stringify({ 
        message: 'No image name found in record',
        record: recordData
      }), { status: 400 })
    }
    
    // Get the image name directly
    const fileName = recordData.image_name
    console.log('Image name to delete:', fileName)

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ 
        error: 'Missing environment variables' 
      }), { status: 500 })
    }
    
    // Use the correct Storage URL pattern
    const storageUrl = `${supabaseUrl}/storage/v1/object/images/public/${fileName}`
    console.log('Deleting image at URL:', storageUrl)
    
    // Make the DELETE request to Storage API
    const response = await fetch(storageUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    })
    
    // Log response information
    const responseStatus = response.status
    let responseText = ''
    try {
      responseText = await response.text()
    } catch (e) {
      responseText = 'Could not read response text'
    }
    
    console.log('Delete response status:', responseStatus)
    console.log('Delete response text:', responseText)
    
    if (!response.ok) {
      console.error('Failed to delete image')
      return new Response(JSON.stringify({ 
        error: `Failed to delete image: ${responseStatus} ${responseText}`,
        fileName: fileName
      }), { status: 500 })
    }
    
    // Success!
    console.log('Successfully deleted image:', fileName)
    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully deleted image: ${fileName}`
    }), { status: 200 })
    
  } catch (error) {
    console.error('Unexpected error:', error instanceof Error ? error.message : 'Unknown error')
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), { status: 500 })
  }
})
