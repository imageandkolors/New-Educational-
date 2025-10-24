import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authMiddleware } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  const authResponse = await authMiddleware(request)
  if (authResponse) return authResponse

  try {
    const syncData = await request.json()
    const { table, operation, data, timestamp } = syncData

    // Process the sync operation based on table and operation type
    switch (table) {
      case 'users':
        await handleUserSync(operation, data)
        break
      case 'licenses':
        await handleLicenseSync(operation, data)
        break
      case 'audit_logs':
        await handleAuditLogSync(operation, data)
        break
      default:
        throw new Error(`Unsupported table: ${table}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully'
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}

async function handleUserSync(operation: string, data: any) {
  switch (operation) {
    case 'CREATE':
      await prisma.user.create({ data })
      break
    case 'UPDATE':
      await prisma.user.update({
        where: { id: data.id },
        data
      })
      break
    case 'DELETE':
      await prisma.user.delete({
        where: { id: data.id }
      })
      break
  }
}

async function handleLicenseSync(operation: string, data: any) {
  switch (operation) {
    case 'CREATE':
      await prisma.license.create({ data })
      break
    case 'UPDATE':
      await prisma.license.update({
        where: { id: data.id },
        data
      })
      break
  }
}

async function handleAuditLogSync(operation: string, data: any) {
  if (operation === 'CREATE') {
    await prisma.auditLog.create({ data })
  }
}