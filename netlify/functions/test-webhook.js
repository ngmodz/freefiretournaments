/**
 * Simple webhook test function
 * Use this endpoint for testing webhook integrations
 */
exports.handler = async (event, context) => {
  // Log headers and body for debugging
  console.log('Request headers:', JSON.stringify(event.headers, null, 2));
  console.log('Request body:', event.body);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message: 'Webhook test successful',
      receivedData: event.body ? JSON.parse(event.body) : {},
      receivedHeaders: event.headers
    })
  };
};
