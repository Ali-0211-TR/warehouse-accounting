import { UserEntity } from '../model/types'
import { Card, CardContent } from '../../../shared/ui/shadcn/card'
import { Badge } from '../../../shared/ui/shadcn/badge'
import { User, Phone } from 'lucide-react'

interface UserCardProps {
    user: UserEntity
    onClick?: () => void
    className?: string
}

export function UserCard({ user, onClick, className }: UserCardProps) {
    return (
        <Card
            className={`cursor-pointer hover:shadow-md transition-shadow ${className}`}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                            <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{user.full_name}</h3>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                            {user.phone_number && (
                                <div className="flex items-center mt-1">
                                    <Phone className="h-3 w-3 text-gray-400 mr-1" />
                                    <span className="text-xs text-gray-500">{user.phone_number}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {user.roles.slice(0, 2).map(role => (
                            <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                            </Badge>
                        ))}
                        {user.roles.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                                +{user.roles.length - 2}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}