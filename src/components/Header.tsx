import { FileText, Users, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import sahpacLogo from '@/assets/sahpac-logo.png';

interface HeaderProps {
  activeTab: 'invoices' | 'clients' | 'new' | 'admin';
  onTabChange: (tab: 'invoices' | 'clients' | 'new' | 'admin') => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-elevated">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center p-1 sm:p-2 shrink-0">
              <img src={sahpacLogo} alt="SAHPAC Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-2xl font-bold">SAHPAC</h1>
              <p className="text-sm opacity-90">Gestion des Factures</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <nav className="flex gap-1 sm:gap-2">
              <Button
                variant={activeTab === 'invoices' ? 'secondary' : 'ghost'}
                onClick={() => onTabChange('invoices')}
                size="sm"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Factures</span>
              </Button>
              <Button
                variant={activeTab === 'clients' ? 'secondary' : 'ghost'}
                onClick={() => onTabChange('clients')}
                size="sm"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Clients</span>
              </Button>
            </nav>
            
            <div className="flex items-center gap-1 border-l border-primary-foreground/20 pl-1 sm:pl-2 ml-1 sm:ml-2">
              <span className="text-sm opacity-75 hidden lg:inline">{user?.email}</span>
              <Button
                variant={activeTab === 'admin' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => onTabChange('admin')}
                title="Administration"
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Déconnexion"
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
