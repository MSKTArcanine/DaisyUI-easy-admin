<?php

namespace App\Command;

use App\Entity\Entry;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

#[AsCommand(name: 'app:fixtures')]
class FixturesCommand extends Command
{
    public function __construct(private readonly EntityManagerInterface $entityManager)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addArgument('operation', InputArgument::OPTIONAL, 'Use seed or state.', 'state');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        if ('seed' === $input->getArgument('operation')) {
            $metadata = $this->entityManager->getClassMetadata(Entry::class);
            $schema = new SchemaTool($this->entityManager);
            $schema->dropSchema([$metadata]);
            $schema->createSchema([$metadata]);
            for ($index = 1; $index <= 3; ++$index) {
                $this->entityManager->persist((new Entry())->setTitle('Entry '.$index)->setPriority($index)->setNotes('Notes '.$index));
            }
            $this->entityManager->flush();
        }
        $entries = $this->entityManager->getRepository(Entry::class)->findBy([], ['priority' => 'ASC']);
        $output->writeln(json_encode(['entries' => array_map(static fn (Entry $entry): array => ['id' => $entry->getId(), 'title' => $entry->getTitle(), 'status' => $entry->getStatus(), 'priority' => $entry->getPriority(), 'notes' => $entry->getNotes(), 'published' => $entry->isPublished()], $entries)], \JSON_THROW_ON_ERROR));

        return Command::SUCCESS;
    }
}
