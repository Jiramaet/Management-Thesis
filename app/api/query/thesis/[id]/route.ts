
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // const user = getUserById(params.id);
  // if (!user) return new Response('Not found', { status: 404 });
  return Response.json({ message: params.id });
}