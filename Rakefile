
FILES = FileList.new("./*").reject{|e| e =~ /tmp/ || e =~ /data/ || e =~ /build/}

task :rsync do |t|
    sh "rsync -ahlrtuvze 'ssh -p 3843' %s hatano@www.piscs.net:~/mediator/" % FILES.join(" ");
end